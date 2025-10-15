# -*- coding: utf-8 -*-
"""Multi-agent debate orchestrator for Friday.
多智能体辩论编排器

This module implements the debate workflow between multiple agents with a moderator.
Based on AgentScope's multi-agent debate tutorial:
https://doc.agentscope.io/tutorial/workflow_multiagent_debate.html
"""
import asyncio
from typing import List, Dict, Any, Optional

from pydantic import BaseModel, Field

from agentscope.agent import ReActAgent
from agentscope.message import Msg
from agentscope.pipeline import MsgHub
from agentscope.model import ChatModelBase
from agentscope.formatter import FormatterBase
from agentscope.tool import Toolkit

from hook import studio_pre_print_hook, studio_post_reply_hook


class JudgeModel(BaseModel):
    """裁判评估结果的结构化输出模型 (Structured output model for judge evaluation)"""

    finished: bool = Field(
        description="Whether the debate should be finished. True when consensus is reached or clear winner emerges."
    )
    correct_answer: Optional[str] = Field(
        description="The final conclusion if debate is finished, otherwise None",
        default=None,
    )
    reasoning: str = Field(
        description="The reasoning behind the judgment",
        default="",
    )


class DebateConfig:
    """辩论配置类 (Debate configuration class)"""

    def __init__(
        self,
        num_agents: int = 2,
        max_rounds: int = 3,
        topic: str = "",
        agent_roles: Optional[List[str]] = None,
    ):
        self.num_agents = num_agents
        self.max_rounds = max_rounds
        self.topic = topic
        self.agent_roles = agent_roles or self._get_default_roles(num_agents)

    @staticmethod
    def _get_default_roles(num_agents: int) -> List[str]:
        """生成默认角色列表 (Generate default role list)"""
        roles = [
            "Proponent (倾向支持)",
            "Opponent (倾向反对)",
            "Neutral Analyst (中立分析)",
            "Risk Assessor (风险评估)",
            "Optimist (乐观派)",
        ]
        return roles[:num_agents]


class DebateOrchestrator:
    """辩论编排器 - 管理整个辩论流程 (Debate orchestrator - manages the entire debate process)"""

    def __init__(
        self,
        config: DebateConfig,
        model: ChatModelBase,
        formatter: FormatterBase,
        toolkit: Optional[Toolkit] = None,
        studio_url: str = "",
    ):
        self.config = config
        self.model = model
        self.formatter = formatter
        self.toolkit = toolkit
        self.studio_url = studio_url

        self.debaters: List[ReActAgent] = []
        self.moderator: Optional[ReActAgent] = None
        self.debate_history: List[Dict[str, Any]] = []

    def _create_debater_sys_prompt(self, role: str, position: int) -> str:
        """为辩论者创建系统提示词 (Create system prompt for debater)"""
        return f"""你是辩论中的第{position + 1}号辩手，你的角色定位是: {role}

# 你的职责 (Your Responsibilities)
- 根据你的角色立场，对辩论主题提出有力的论点
- 认真倾听其他辩手的观点，并进行有理有据的回应
- 保持开放态度，但坚定捍卫你的立场
- 使用逻辑、数据和实例来支撑你的论点
- 在合适的时候承认对方的合理之处，但要指出不足

# 辩论风格 (Debate Style)
- 保持专业和尊重的态度
- 避免人身攻击，专注于观点本身
- 简洁明了地表达你的观点（每次发言控制在200字以内）
- 引用具体的例子和事实

# 重要提示 (Important Notes)
- 这是一个建设性的讨论，目标是找到最佳答案
- 你可以改变观点，如果其他辩手提供了令人信服的论据
- 每轮发言要针对之前的讨论内容，不要重复相同的论点"""

    def _create_moderator_sys_prompt(self) -> str:
        """为裁判创建系统提示词 (Create system prompt for moderator)"""
        return """你是辩论的公正裁判和主持人。

# 你的职责 (Your Responsibilities)
1. **监督辩论进程**: 确保辩论有序进行
2. **评估论点质量**: 分析各方论据的合理性和说服力
3. **判断终止时机**: 决定是否应该结束辩论
4. **总结结论**: 在辩论结束时给出综合性的最终答案

# 判断标准 (Judging Criteria)
结束辩论的条件（满足任一即可）：
- ✅ 各方已达成明确共识
- ✅ 某一方的论点明显更有说服力，其他方无力反驳
- ✅ 已经充分探讨，继续辩论不会产生新见解
- ✅ 所有重要角度都已被涵盖

继续辩论的条件：
- ❌ 仍有重要观点未被讨论
- ❌ 论点之间存在明显矛盾需要澄清
- ❌ 某些论据需要进一步展开

# 输出格式 (Output Format)
你必须以结构化格式输出评估结果：
- finished: true/false (是否结束辩论)
- correct_answer: 最终结论（如果finished=true）
- reasoning: 你的判断理由

# 评估原则 (Evaluation Principles)
- 保持绝对中立，不偏袒任何一方
- 基于逻辑和证据做出判断
- 给出清晰的理由说明你的决定"""

    async def create_debate_agents(self) -> None:
        """创建所有辩论智能体 (Create all debate agents)"""
        self.debaters = []

        for i, role in enumerate(self.config.agent_roles):
            agent = ReActAgent(
                name=f"Debater_{i+1}_{role.split()[0]}",  # 例如: Debater_1_Proponent
                sys_prompt=self._create_debater_sys_prompt(role, i),
                model=self.model,
                formatter=self.formatter,
                toolkit=self.toolkit,
                max_iters=10,
                enable_meta_tool=False,  # 辩论场景不需要元工具
            )

            # 注册hook，让辩论消息自动推送到前端 (Register hooks to push messages to frontend)
            if self.studio_url:
                agent.register_class_hook(
                    "pre_print",
                    "studio_pre_print_hook",
                    studio_pre_print_hook
                )
                agent.register_class_hook(
                    "post_reply",
                    "studio_post_reply_hook",
                    studio_post_reply_hook
                )

            self.debaters.append(agent)

    async def create_moderator(self) -> None:
        """创建裁判智能体 (Create moderator agent)"""
        self.moderator = ReActAgent(
            name="Moderator",
            sys_prompt=self._create_moderator_sys_prompt(),
            model=self.model,
            formatter=self.formatter,
            max_iters=5,
            enable_meta_tool=False,
        )

        # 裁判消息也推送到前端 (Push moderator messages to frontend)
        if self.studio_url:
            self.moderator.register_class_hook(
                "pre_print",
                "studio_pre_print_hook",
                studio_pre_print_hook
            )
            self.moderator.register_class_hook(
                "post_reply",
                "studio_post_reply_hook",
                studio_post_reply_hook
            )

    async def run_debate(self, topic: str) -> Dict[str, Any]:
        """运行完整的辩论流程 (Run the complete debate process)

        Args:
            topic: 辩论主题 (Debate topic)

        Returns:
            辩论结果字典，包含最终结论和辩论历史
            (Debate result dictionary containing final conclusion and history)
        """
        # 确保智能体已创建 (Ensure agents are created)
        if not self.debaters:
            await self.create_debate_agents()
        if not self.moderator:
            await self.create_moderator()

        # 构造初始主题消息 (Construct initial topic message)
        topic_msg = Msg(
            name="system",
            content=f"辩论主题: {topic}\n\n请各位辩手根据自己的角色立场，发表观点。",
            role="system"
        )

        print(f"\n{'='*60}")
        print(f"[DEBATE START] Topic: {topic}")
        print(f"[PARTICIPANTS] {len(self.debaters)} debaters + 1 moderator")
        print(f"[MAX ROUNDS] {self.config.max_rounds}")
        print(f"{'='*60}\n")

        current_round = 0
        final_result = None

        # 辩论主循环 (Main debate loop)
        while current_round < self.config.max_rounds:
            current_round += 1
            print(f"\n--- [ROUND {current_round}/{self.config.max_rounds}] Debate round starts ---\n")

            # 阶段1: 辩论者轮流发言（在MsgHub中）(Phase 1: Debaters speak in MsgHub)
            async with MsgHub(
                participants=[*self.debaters, self.moderator]
            ):
                for idx, debater in enumerate(self.debaters):
                    if current_round == 1:
                        # 第一轮：直接回应主题 (First round: respond to topic directly)
                        response = await debater(topic_msg)
                    else:
                        # 后续轮次：基于之前的讨论继续 (Subsequent rounds: continue based on previous discussion)
                        prompt = Msg(
                            name="system",
                            content=f"请根据之前的讨论，进一步阐述你的观点或回应其他辩手。",
                            role="system"
                        )
                        response = await debater(prompt)

                    # 记录到历史 (Record to history)
                    self.debate_history.append({
                        "round": current_round,
                        "speaker": debater.name,
                        "role": self.config.agent_roles[idx],
                        "content": response.content,
                    })

            # 阶段2: 裁判评估（独立于MsgHub）(Phase 2: Judge evaluation outside MsgHub)
            print(f"\n--- [JUDGE] Evaluating... ---\n")

            judge_prompt = Msg(
                name="system",
                content=f"""现在是第{current_round}轮辩论结束。请评估：
1. 各方论点的质量和说服力
2. 是否已经可以得出结论
3. 是否应该继续下一轮辩论

请根据评估标准，给出你的判断。""",
                role="system"
            )

            # 使用结构化输出调用裁判 (Call moderator with structured output)
            judge_response = await self.moderator(judge_prompt, structured_model=JudgeModel)

            # 解析裁判的结构化输出 (Parse judge's structured output)
            finished = judge_response.metadata.get("finished", False)
            correct_answer = judge_response.metadata.get("correct_answer", "")
            reasoning = judge_response.metadata.get("reasoning", "")

            self.debate_history.append({
                "round": current_round,
                "speaker": "Moderator",
                "role": "Judge",
                "content": judge_response.content,
                "finished": finished,
                "conclusion": correct_answer,
            })

            # 阶段3: 检查是否结束 (Phase 3: Check if debate should end)
            if finished:
                print(f"\n{'='*60}")
                print(f"[JUDGE] Debate finished!")
                print(f"[CONCLUSION] {correct_answer}")
                print(f"[REASONING] {reasoning}")
                print(f"{'='*60}\n")

                final_result = {
                    "finished": True,
                    "conclusion": correct_answer,
                    "reasoning": reasoning,
                    "total_rounds": current_round,
                    "history": self.debate_history,
                }
                break

        # 如果达到最大轮数仍未结束 (If max rounds reached without conclusion)
        if not final_result:
            print(f"\n{'='*60}")
            print(f"[TIMEOUT] Max rounds ({self.config.max_rounds}) reached, debate ends")
            print(f"{'='*60}\n")

            # 请裁判给出最终总结 (Ask judge for final summary)
            final_summary_prompt = Msg(
                name="system",
                content="辩论已达到最大轮数。请总结各方观点，给出你的最终结论。",
                role="system"
            )
            final_judge = await self.moderator(final_summary_prompt, structured_model=JudgeModel)

            final_result = {
                "finished": True,
                "conclusion": final_judge.metadata.get("correct_answer", "未能达成明确结论"),
                "reasoning": "达到最大轮数限制",
                "total_rounds": current_round,
                "history": self.debate_history,
            }

        return final_result
