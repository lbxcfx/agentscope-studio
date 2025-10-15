# 辩论智能体开发文档 (Multi-Agent Debate Development Guide)

> **参考文档**: https://doc.agentscope.io/tutorial/workflow_multiagent_debate.html

## 目录
1. [功能概述](#功能概述)
2. [技术架构](#技术架构)
3. [核心原理](#核心原理)
4. [详细实施方案](#详细实施方案)
5. [代码实现](#代码实现)
6. [测试与验证](#测试与验证)
7. [部署与配置](#部署与配置)

---

## 功能概述

### 什么是多智能体辩论？

多智能体辩论是一种让多个AI智能体通过多轮讨论、交换观点和论证来探讨复杂问题的交互模式。通过模拟人类辩论过程，能够：

- ✅ 从多个视角分析问题
- ✅ 发现单一智能体可能忽略的观点
- ✅ 通过对抗性思考提高答案质量
- ✅ 为复杂决策提供更全面的依据

### 应用场景

- 技术方案选型与对比
- 产品功能优先级讨论
- 代码审查与多视角分析
- 创意头脑风暴
- 复杂问题求解
- 知识验证与纠错

---

## 技术架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (Client)                          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Friday设置页面 - 辩论模式配置                           │  │
│  │  - 启用/禁用开关                                         │  │
│  │  - 辩论者数量 (2-5)                                      │  │
│  │  - 辩论轮数 (1-10)                                       │  │
│  │  - Topic输入框                                           │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  聊天界面 - 实时辩论显示                                 │  │
│  │  - 辩论者消息气泡 (带角色标识)                           │  │
│  │  - 裁判评价消息                                          │  │
│  │  - 辩论进度条                                            │  │
│  │  - 最终结论展示                                          │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↕ WebSocket (实时通信)
┌─────────────────────────────────────────────────────────────┐
│                      服务器 (Server)                          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Socket Manager (packages/server/src/trpc/socket.ts)   │  │
│  │  - 接收前端辩论请求                                      │  │
│  │  - 调用Python脚本 (带辩论参数)                           │  │
│  │  - 推送辩论消息到前端                                     │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  TRPC Router (packages/server/src/trpc/router.ts)      │  │
│  │  - pushMessageToFridayApp (已有,复用)                   │  │
│  │  - pushFinishedSignalToFridayApp (已有,复用)            │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↕ Spawn Python Process
┌─────────────────────────────────────────────────────────────┐
│                    Friday App (Python)                        │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  main.py - 入口点                                        │  │
│  │  - 检测 --debateMode 参数                               │  │
│  │  - 分发到辩论模式 or 普通模式                            │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  debate.py - 辩论编排模块 (新增)                        │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  DebateOrchestrator 类                            │  │  │
│  │  │  - create_debate_agents()                        │  │  │
│  │  │  - create_moderator()                            │  │  │
│  │  │  - run_debate() ← 核心辩论循环                   │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  智能体系统                                       │  │  │
│  │  │  ┌────────────┐  ┌────────────┐  ┌────────────┐ │  │  │
│  │  │  │ Debater 1  │  │ Debater 2  │  │ Debater 3  │ │  │  │
│  │  │  │ (激进派)   │  │ (保守派)   │  │ (中立派)   │ │  │  │
│  │  │  └────────────┘  └────────────┘  └────────────┘ │  │  │
│  │  │         ↓               ↓               ↓        │  │  │
│  │  │  ┌─────────────────────────────────────────┐    │  │  │
│  │  │  │         MsgHub (消息广播中心)            │    │  │  │
│  │  │  └─────────────────────────────────────────┘    │  │  │
│  │  │         ↓                                        │  │  │
│  │  │  ┌────────────────────────────────────────┐     │  │  │
│  │  │  │     Moderator (裁判智能体)              │     │  │  │
│  │  │  │     - 结构化输出判断                    │     │  │  │
│  │  │  │     - finished: bool                   │     │  │  │
│  │  │  │     - correct_answer: str              │     │  │  │
│  │  │  └────────────────────────────────────────┘     │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  hook.py - 消息推送钩子 (已有,复用)                      │  │
│  │  - studio_pre_print_hook → 推送所有辩论消息             │  │
│  │  - studio_post_reply_hook → 推送完成信号                │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 核心组件说明

| 组件 | 位置 | 职责 | 是否新增 |
|------|------|------|---------|
| **辩论配置UI** | `packages/client/src/pages/FridaySettingPage` | 用户配置辩论参数 | ✅ 新增 |
| **辩论消息气泡** | `packages/client/src/components/chat/bubbles/` | 显示辩论者消息 | ✅ 新增 |
| **Socket扩展** | `packages/server/src/trpc/socket.ts` | 传递辩论参数 | 🔧 修改 |
| **辩论编排器** | `packages/app/friday/debate.py` | 核心辩论逻辑 | ✅ 新增 |
| **参数定义** | `packages/app/friday/args.py` | 辩论参数解析 | 🔧 修改 |
| **主入口** | `packages/app/friday/main.py` | 模式分发 | 🔧 修改 |

---

## 核心原理

### 1. AgentScope多智能体辩论原理

#### MsgHub机制

**MsgHub** 是AgentScope提供的消息广播中心，核心特性：

```python
# 在async with块中，所有参与者共享消息上下文
async with MsgHub(participants=[agent1, agent2, agent3, moderator]):
    msg1 = await agent1(topic)  # agent1发言
    msg2 = await agent2(msg1)   # agent2回应agent1
    # 所有消息都会广播给所有参与者
```

**工作流程**：
1. 所有智能体加入MsgHub
2. 任一智能体发言时，消息自动广播给所有其他参与者
3. 智能体可以看到完整的对话历史
4. 退出MsgHub上下文后，可以进行裁判评估

#### 辩论循环控制

```python
round_num = 0
while round_num < max_rounds:
    # 第1步：辩论者发言阶段
    async with MsgHub(participants=[debater1, debater2, debater3, moderator]):
        await debater1(topic)
        await debater2(topic)
        await debater3(topic)

    # 第2步：裁判评估阶段（独立于MsgHub）
    judge_result = await moderator(Msg("system", "请评估本轮辩论"))

    # 第3步：检查终止条件
    if judge_result.metadata.get("finished"):
        break

    round_num += 1
```

### 2. 结构化输出（裁判判定）

使用Pydantic模型定义裁判的输出格式：

```python
from pydantic import BaseModel, Field

class JudgeModel(BaseModel):
    """裁判结构化输出模型"""
    finished: bool = Field(
        description="是否应该结束辩论。当各方达成共识或某方论点完全胜出时为True"
    )
    correct_answer: str | None = Field(
        description="如果辩论结束，给出最终结论；否则为None",
        default=None,
    )
    reasoning: str = Field(
        description="裁判的评估理由，说明为什么做出此判断",
        default="",
    )
```

**在ReActAgent中使用**：

```python
moderator = ReActAgent(
    name="Moderator",
    sys_prompt="你是公正的裁判...",
    model=model,
    output_schema=JudgeModel,  # ← 指定结构化输出
)

# 裁判的回复会自动解析为JudgeModel实例
result = await moderator(msg)
finished = result.metadata.get("finished")  # 获取结构化字段
```

### 3. 不影响现有功能的设计原则

#### 兼容性保证

1. **条件分支隔离**
```python
# main.py
if args.debateMode:
    # 辩论模式分支 - 全新逻辑
    orchestrator = DebateOrchestrator(config)
    await orchestrator.run_debate(query)
else:
    # 原有单智能体模式 - 完全不变
    await agent(Msg("user", query, "user"))
```

2. **配置向后兼容**
```python
# args.py - 所有辩论参数都是可选的
parser.add_argument("--debateMode", type=bool, default=False, required=False)
parser.add_argument("--debateAgents", type=int, default=2, required=False)
parser.add_argument("--debateRounds", type=int, default=3, required=False)
parser.add_argument("--debateTopic", type=str, default="", required=False)
```

3. **Hook机制复用**
```python
# 所有辩论智能体都注册相同的hook，自动推送到前端
for debater in debate_agents:
    debater.register_class_hook("pre_print", "studio_pre_print_hook", studio_pre_print_hook)
    debater.register_class_hook("post_reply", "studio_post_reply_hook", studio_post_reply_hook)
```

---

## 详细实施方案

### Phase 1: 后端核心开发

#### 1.1 创建辩论编排模块 (`packages/app/friday/debate.py`)

```python
# -*- coding: utf-8 -*-
"""Multi-agent debate orchestrator for Friday.

This module implements the debate workflow between multiple agents with a moderator.
Based on AgentScope's multi-agent debate tutorial.
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
    """裁判评估结果的结构化输出模型"""
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
    """辩论配置类"""
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
        """生成默认角色列表"""
        roles = [
            "Proponent (倾向支持)",
            "Opponent (倾向反对)",
            "Neutral Analyst (中立分析)",
            "Risk Assessor (风险评估)",
            "Optimist (乐观派)",
        ]
        return roles[:num_agents]


class DebateOrchestrator:
    """辩论编排器 - 管理整个辩论流程"""

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
        """为辩论者创建系统提示词"""
        return f"""你是辩论中的第{position + 1}号辩手，你的角色定位是: {role}

# 你的职责
- 根据你的角色立场，对辩论主题提出有力的论点
- 认真倾听其他辩手的观点，并进行有理有据的回应
- 保持开放态度，但坚定捍卫你的立场
- 使用逻辑、数据和实例来支撑你的论点
- 在合适的时候承认对方的合理之处，但要指出不足

# 辩论风格
- 保持专业和尊重的态度
- 避免人身攻击，专注于观点本身
- 简洁明了地表达你的观点（每次发言控制在200字以内）
- 引用具体的例子和事实

# 重要提示
- 这是一个建设性的讨论，目标是找到最佳答案
- 你可以改变观点，如果其他辩手提供了令人信服的论据
- 每轮发言要针对之前的讨论内容，不要重复相同的论点"""

    def _create_moderator_sys_prompt(self) -> str:
        """为裁判创建系统提示词"""
        return """你是辩论的公正裁判和主持人。

# 你的职责
1. **监督辩论进程**: 确保辩论有序进行
2. **评估论点质量**: 分析各方论据的合理性和说服力
3. **判断终止时机**: 决定是否应该结束辩论
4. **总结结论**: 在辩论结束时给出综合性的最终答案

# 判断标准
结束辩论的条件（满足任一即可）：
- ✅ 各方已达成明确共识
- ✅ 某一方的论点明显更有说服力，其他方无力反驳
- ✅ 已经充分探讨，继续辩论不会产生新见解
- ✅ 所有重要角度都已被涵盖

继续辩论的条件：
- ❌ 仍有重要观点未被讨论
- ❌ 论点之间存在明显矛盾需要澄清
- ❌ 某些论据需要进一步展开

# 输出格式
你必须以结构化格式输出评估结果：
- finished: true/false (是否结束辩论)
- correct_answer: 最终结论（如果finished=true）
- reasoning: 你的判断理由

# 评估原则
- 保持绝对中立，不偏袒任何一方
- 基于逻辑和证据做出判断
- 给出清晰的理由说明你的决定"""

    async def create_debate_agents(self) -> None:
        """创建所有辩论智能体"""
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

            # 注册hook，让辩论消息自动推送到前端
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
        """创建裁判智能体"""
        self.moderator = ReActAgent(
            name="Moderator",
            sys_prompt=self._create_moderator_sys_prompt(),
            model=self.model,
            formatter=self.formatter,
            output_schema=JudgeModel,  # 使用结构化输出
            max_iters=5,
            enable_meta_tool=False,
        )

        # 裁判消息也推送到前端
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
        """运行完整的辩论流程

        Args:
            topic: 辩论主题

        Returns:
            辩论结果字典，包含最终结论和辩论历史
        """
        # 确保智能体已创建
        if not self.debaters:
            await self.create_debate_agents()
        if not self.moderator:
            await self.create_moderator()

        # 构造初始主题消息
        topic_msg = Msg(
            name="system",
            content=f"辩论主题: {topic}\n\n请各位辩手根据自己的角色立场，发表观点。",
            role="system"
        )

        print(f"\n{'='*60}")
        print(f"🎭 辩论开始！主题: {topic}")
        print(f"📊 参与者: {len(self.debaters)}位辩手 + 1位裁判")
        print(f"🔄 最多轮数: {self.config.max_rounds}")
        print(f"{'='*60}\n")

        current_round = 0
        final_result = None

        # 辩论主循环
        while current_round < self.config.max_rounds:
            current_round += 1
            print(f"\n--- 第 {current_round}/{self.config.max_rounds} 轮辩论开始 ---\n")

            # 阶段1: 辩论者轮流发言（在MsgHub中）
            async with MsgHub(
                participants=[*self.debaters, self.moderator]
            ):
                for idx, debater in enumerate(self.debaters):
                    if current_round == 1:
                        # 第一轮：直接回应主题
                        response = await debater(topic_msg)
                    else:
                        # 后续轮次：基于之前的讨论继续
                        prompt = Msg(
                            name="system",
                            content=f"请根据之前的讨论，进一步阐述你的观点或回应其他辩手。",
                            role="system"
                        )
                        response = await debater(prompt)

                    # 记录到历史
                    self.debate_history.append({
                        "round": current_round,
                        "speaker": debater.name,
                        "role": self.config.agent_roles[idx],
                        "content": response.content,
                    })

            # 阶段2: 裁判评估（独立于MsgHub）
            print(f"\n--- 裁判评估中... ---\n")

            judge_prompt = Msg(
                name="system",
                content=f"""现在是第{current_round}轮辩论结束。请评估：
1. 各方论点的质量和说服力
2. 是否已经可以得出结论
3. 是否应该继续下一轮辩论

请根据评估标准，给出你的判断。""",
                role="system"
            )

            judge_response = await self.moderator(judge_prompt)

            # 解析裁判的结构化输出
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

            # 阶段3: 检查是否结束
            if finished:
                print(f"\n{'='*60}")
                print(f"✅ 裁判宣布辩论结束！")
                print(f"📝 结论: {correct_answer}")
                print(f"💭 理由: {reasoning}")
                print(f"{'='*60}\n")

                final_result = {
                    "finished": True,
                    "conclusion": correct_answer,
                    "reasoning": reasoning,
                    "total_rounds": current_round,
                    "history": self.debate_history,
                }
                break

        # 如果达到最大轮数仍未结束
        if not final_result:
            print(f"\n{'='*60}")
            print(f"⏰ 已达到最大轮数 ({self.config.max_rounds})，辩论结束")
            print(f"{'='*60}\n")

            # 请裁判给出最终总结
            final_summary_prompt = Msg(
                name="system",
                content="辩论已达到最大轮数。请总结各方观点，给出你的最终结论。",
                role="system"
            )
            final_judge = await self.moderator(final_summary_prompt)

            final_result = {
                "finished": True,
                "conclusion": final_judge.metadata.get("correct_answer", "未能达成明确结论"),
                "reasoning": "达到最大轮数限制",
                "total_rounds": current_round,
                "history": self.debate_history,
            }

        return final_result
```

#### 1.2 扩展参数解析 (`packages/app/friday/args.py`)

```python
# -*- coding: utf-8 -*-
from argparse import ArgumentParser, Namespace


def get_args() -> Namespace:
    """Get the command line arguments for the script."""
    parser = ArgumentParser(description="Arguments for friday")

    # 现有参数保持不变
    parser.add_argument("--query", type=str, required=False)
    parser.add_argument("--query-file", type=str, required=False)
    parser.add_argument("--studio_url", type=str, required=True)
    parser.add_argument(
        "--llmProvider",
        choices=["dashscope", "openai", "anthropic", "gemini", "ollama"],
        required=True,
    )
    parser.add_argument("--modelName", type=str, required=True)
    parser.add_argument("--visionModelName", type=str, required=False)
    parser.add_argument("--apiKey", type=str, required=True)
    parser.add_argument("--writePermission", type=bool, required=True)
    parser.add_argument("--baseUrl", type=str, required=False)

    # 🆕 新增辩论模式参数
    parser.add_argument(
        "--debateMode",
        type=lambda x: x.lower() == 'true',  # 转换字符串 "true"/"false" 为布尔值
        default=False,
        required=False,
        help="Enable multi-agent debate mode"
    )
    parser.add_argument(
        "--debateAgents",
        type=int,
        default=2,
        required=False,
        help="Number of debate agents (2-5 recommended)"
    )
    parser.add_argument(
        "--debateRounds",
        type=int,
        default=3,
        required=False,
        help="Maximum number of debate rounds (1-10)"
    )
    parser.add_argument(
        "--debateTopic",
        type=str,
        default="",
        required=False,
        help="The topic for debate (if empty, will use query content)"
    )

    args = parser.parse_args()

    # 验证参数
    if not args.query and not args.query_file:
        parser.error("Either --query or --query-file must be provided")

    # 辩论参数验证
    if args.debateMode:
        if not (2 <= args.debateAgents <= 5):
            parser.error("debateAgents must be between 2 and 5")
        if not (1 <= args.debateRounds <= 10):
            parser.error("debateRounds must be between 1 and 10")
        if not args.debateTopic and not args.query:
            parser.error("debateTopic or query must be provided in debate mode")

    return args
```

#### 1.3 修改主入口 (`packages/app/friday/main.py`)

```python
# -*- coding: utf-8 -*-
"""The main entry point for AgentScope studio application, Friday."""
import asyncio
import os
from datetime import datetime

import json5
from agentscope.agent import ReActAgent
from agentscope.memory import InMemoryMemory
from agentscope.message import Msg
from agentscope.session import JSONSession
from agentscope.tool import (
    Toolkit,
    execute_python_code,
    execute_shell_command,
    write_text_file,
    insert_text_file,
    view_text_file,
)

from hook import (
    studio_pre_print_hook,
    studio_post_reply_hook,
)
from args import get_args
from model import get_model, get_formatter
from tool.utils import (
    view_agentscope_library,
    view_agentscope_readme,
    view_agentscope_faq,
)
from utils.common import get_local_file_path
from utils.connect import StudioConnect
from utils.constants import FRIDAY_SESSION_ID
from utils.image_converter import ImageConverter

# 🆕 导入辩论模块
from debate import DebateOrchestrator, DebateConfig


async def main():
    args = get_args()

    studio_pre_print_hook.url = args.studio_url

    # Initialize image converter
    image_converter = ImageConverter()

    # 🆕 检测辩论模式 - 在注册hook之前决定模式
    is_debate_mode = args.debateMode

    # get model from args
    model = get_model(args.llmProvider, args.modelName, args.apiKey, args.baseUrl)
    formatter = get_formatter(args.llmProvider)

    # Parse and convert the query content
    query_content = json5.loads(args.query)
    converted_content = image_converter.convert_content_blocks(query_content)
    print(f"DEBUG - Converted content: {converted_content}")

    # The socket is used for realtime steering
    socket = StudioConnect(url=args.studio_url, agent=None)  # agent稍后设置
    await socket.connect()

    try:
        # 🆕 辩论模式分支
        if is_debate_mode:
            print("\n" + "="*60)
            print("🎭 启动辩论模式 (Multi-Agent Debate Mode)")
            print("="*60 + "\n")

            # 准备工具包（辩论模式可能不需要工具，根据需求调整）
            toolkit = Toolkit()
            # 辩论场景通常不需要执行代码/命令，可以选择不注册工具
            # toolkit.register_tool_function(execute_python_code)
            # toolkit.register_tool_function(execute_shell_command)

            # 创建辩论配置
            debate_config = DebateConfig(
                num_agents=args.debateAgents,
                max_rounds=args.debateRounds,
                topic=args.debateTopic or self._extract_text_from_content(converted_content),
            )

            # 创建辩论编排器
            orchestrator = DebateOrchestrator(
                config=debate_config,
                model=model,
                formatter=formatter,
                toolkit=None,  # 辩论通常不需要工具
                studio_url=args.studio_url,
            )

            # 运行辩论
            topic = debate_config.topic
            result = await orchestrator.run_debate(topic)

            print("\n" + "="*60)
            print("✅ 辩论结束")
            print(f"📝 最终结论: {result['conclusion']}")
            print(f"🔄 总轮数: {result['total_rounds']}")
            print("="*60 + "\n")

        # 原有单智能体模式
        else:
            print("\n" + "="*60)
            print("🤖 标准模式 (Single Agent Mode)")
            print("="*60 + "\n")

            # Forward message to the studio
            ReActAgent.register_class_hook(
                "pre_print",
                "studio_pre_print_hook",
                studio_pre_print_hook
            )
            ReActAgent.register_class_hook(
                "post_reply",
                "studio_post_reply_hook",
                studio_post_reply_hook
            )

            # Init agent
            toolkit = Toolkit()
            toolkit.register_tool_function(execute_python_code)
            toolkit.register_tool_function(execute_shell_command)
            toolkit.register_tool_function(view_text_file)
            toolkit.register_tool_function(insert_text_file)
            if args.writePermission:
                toolkit.register_tool_function(write_text_file)

            # AgentScope tool group
            toolkit.create_tool_group(
                group_name="agentscope_tools",
                description="The AgentScope library related tools...",
                notes="""# AgentScope Expertise..."""
            )
            toolkit.register_tool_function(
                view_agentscope_library, group_name="agentscope_tools"
            )
            toolkit.register_tool_function(
                view_agentscope_readme, group_name="agentscope_tools"
            )
            toolkit.register_tool_function(
                view_agentscope_faq, group_name="agentscope_tools"
            )

            # Function to detect if content contains images
            def has_images(content):
                if isinstance(content, list):
                    for block in content:
                        if isinstance(block, dict):
                            if block.get("type") == "image" and "source" in block:
                                return True
                return False

            # Create the ReAct agent
            agent = ReActAgent(
                name="Friday",
                sys_prompt="""You're Friday, a helpful assistant...""",
                model=model,
                formatter=formatter,
                toolkit=toolkit,
                memory=InMemoryMemory(),
                max_iters=50,
                enable_meta_tool=True,
            )

            # Update socket's agent reference
            socket.agent = agent

            path_dialog_history = get_local_file_path("")
            session = JSONSession(
                session_id=FRIDAY_SESSION_ID,
                save_dir=path_dialog_history
            )

            await session.load_session_state(
                session_id=FRIDAY_SESSION_ID,
                friday=agent
            )

            # Check if we need to use vision model
            if has_images(converted_content) and args.visionModelName:
                vision_model = get_model(
                    args.llmProvider,
                    args.visionModelName,
                    args.apiKey,
                    args.baseUrl
                )
                agent.model = vision_model
                print(f"Switched to vision model: {args.visionModelName}")

            # Send the converted message to the agent
            await agent(Msg("user", converted_content, "user"))

            # Switch back to text model after processing
            if has_images(converted_content) and args.visionModelName:
                agent.model = model
                print(f"Switched back to text model: {args.modelName}")

            # Save dialog history
            await session.save_session_state(
                session_id=FRIDAY_SESSION_ID,
                friday=agent
            )

    finally:
        # Clean up temporary files
        image_converter.cleanup()
        await socket.disconnect()


def _extract_text_from_content(content):
    """从content blocks中提取纯文本"""
    if isinstance(content, str):
        return content
    elif isinstance(content, list):
        texts = []
        for block in content:
            if isinstance(block, dict) and block.get("type") == "text":
                texts.append(block.get("text", ""))
        return " ".join(texts)
    return ""


if __name__ == '__main__':
    asyncio.run(main())
```

---

### Phase 2: 服务器端集成

#### 2.1 扩展Socket通信 (`packages/server/src/trpc/socket.ts`)

在 `SocketEvents.client.sendUserInputToFridayApp` 的处理函数中添加辩论参数：

```typescript
// 在 socket.on(SocketEvents.client.sendUserInputToFridayApp, ...) 中修改

socket.on(
    SocketEvents.client.sendUserInputToFridayApp,
    async (
        name: string,
        role: string,
        content: ContentBlocks,
        debateConfig: {  // 🆕 新增参数
            enabled: boolean;
            agentCount: number;
            rounds: number;
            topic: string;
        } | null,
        callback: (response: BackendResponse) => void,
    ) => {
        // ... 现有代码 ...

        const fridayConfig = fridayConfigManager.getConfig();
        // ...

        // Prepare the arguments for the Python script
        const mainScriptPath = fridayConfig.mainScriptPath
            ? fridayConfig.mainScriptPath
            : fridayConfigManager.getDefaultMainScriptPath();

        const args = [
            mainScriptPath,
            '--query',
            JSON.stringify(content),
            '--studio_url',
            `http://localhost:${config.port}`,
        ];

        console.log(fridayConfig);
        for (const [key, value] of Object.entries(fridayConfig)) {
            if (key !== 'pythonEnv' && key !== 'mainScriptPath') {
                args.push(`--${key}`, value);
            }
        }

        // 🆕 添加辩论参数
        if (debateConfig && debateConfig.enabled) {
            args.push('--debateMode', 'true');
            args.push('--debateAgents', String(debateConfig.agentCount));
            args.push('--debateRounds', String(debateConfig.rounds));
            if (debateConfig.topic) {
                args.push('--debateTopic', debateConfig.topic);
            }
        }

        // ... 运行Python脚本 ...
    }
);
```

#### 2.2 扩展配置类型 (`packages/shared/src/config/friday.ts`)

```typescript
export interface FridayConfig {
    pythonEnv: string;
    mainScriptPath?: string;
    llmProvider: 'dashscope' | 'openai' | 'anthropic' | 'gemini' | 'ollama';
    modelName: string;
    visionModelName?: string;
    apiKey: string;
    writePermission: boolean;
    baseUrl?: string;

    // 🆕 辩论配置
    debateConfig?: {
        enabled: boolean;
        agentCount: number;
        rounds: number;
    };
}
```

---

### Phase 3: 前端界面开发

#### 3.1 Friday设置页面 - 添加辩论配置

**文件**: `packages/client/src/pages/FridaySettingPage/index.tsx`（需要找到对应文件）

在现有配置表单中添加辩论配置区块：

```tsx
import { Card, Form, Switch, Slider, InputNumber, Divider } from 'antd';

// 在现有配置表单中添加
<Divider>辩论模式配置</Divider>

<Card
    title="🎭 多智能体辩论 (Multi-Agent Debate)"
    size="small"
    style={{ marginBottom: 16 }}
>
    <Form.Item
        label="启用辩论模式"
        name={['debateConfig', 'enabled']}
        valuePropName="checked"
        tooltip="开启后，可以让多个AI智能体就某个主题进行辩论，从多角度分析问题"
    >
        <Switch />
    </Form.Item>

    <Form.Item
        noStyle
        shouldUpdate={(prevValues, currentValues) =>
            prevValues.debateConfig?.enabled !== currentValues.debateConfig?.enabled
        }
    >
        {({ getFieldValue }) => {
            const enabled = getFieldValue(['debateConfig', 'enabled']);
            if (!enabled) return null;

            return (
                <>
                    <Form.Item
                        label="辩论者数量"
                        name={['debateConfig', 'agentCount']}
                        initialValue={2}
                        tooltip="参与辩论的智能体数量，建议2-3个"
                        rules={[
                            { required: true, message: '请设置辩论者数量' },
                            { type: 'number', min: 2, max: 5, message: '数量应在2-5之间' }
                        ]}
                    >
                        <Slider
                            min={2}
                            max={5}
                            marks={{
                                2: '2个',
                                3: '3个',
                                4: '4个',
                                5: '5个',
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        label="辩论轮数"
                        name={['debateConfig', 'rounds']}
                        initialValue={3}
                        tooltip="每轮所有智能体各发言一次，建议3-5轮"
                        rules={[
                            { required: true, message: '请设置辩论轮数' },
                            { type: 'number', min: 1, max: 10, message: '轮数应在1-10之间' }
                        ]}
                    >
                        <InputNumber
                            min={1}
                            max={10}
                            style={{ width: '100%' }}
                            addonAfter="轮"
                        />
                    </Form.Item>
                </>
            );
        }}
    </Form.Item>
</Card>
```

#### 3.2 聊天界面 - 添加辩论模式输入

**文件**: `packages/client/src/components/chat/UnifiedUserInput/index.tsx`

添加辩论主题输入框和模式切换：

```tsx
import { Input, Switch, Space, Typography } from 'antd';

const { TextArea } = Input;
const { Text } = Typography;

// 在组件状态中添加
const [debateMode, setDebateMode] = useState(false);
const [debateTopic, setDebateTopic] = useState('');

// 在输入区域添加辩论模式切换
<Space direction="vertical" style={{ width: '100%' }}>
    <Space>
        <Switch
            checked={debateMode}
            onChange={setDebateMode}
            checkedChildren="辩论模式"
            unCheckedChildren="普通模式"
        />
        {debateMode && (
            <Text type="secondary">
                多个智能体将就此主题进行辩论
            </Text>
        )}
    </Space>

    {debateMode ? (
        // 辩论模式：输入主题
        <TextArea
            value={debateTopic}
            onChange={(e) => setDebateTopic(e.target.value)}
            placeholder="请输入辩论主题，例如：我应该学习React还是Vue？"
            autoSize={{ minRows: 2, maxRows: 4 }}
            onPressEnter={(e) => {
                if (e.shiftKey) return; // Shift+Enter换行
                e.preventDefault();
                handleSendDebate();
            }}
        />
    ) : (
        // 普通模式：原有输入框
        <原有的输入组件 />
    )}

    <Button
        type="primary"
        onClick={debateMode ? handleSendDebate : handleSendNormal}
        disabled={debateMode ? !debateTopic.trim() : !normalInput.trim()}
    >
        {debateMode ? '开始辩论' : '发送'}
    </Button>
</Space>

// 添加发送辩论请求的处理函数
const handleSendDebate = () => {
    if (!debateTopic.trim()) return;

    // 从配置中获取辩论参数
    const debateConfig = {
        enabled: true,
        agentCount: fridayConfig.debateConfig?.agentCount || 2,
        rounds: fridayConfig.debateConfig?.rounds || 3,
        topic: debateTopic,
    };

    // 构造消息内容
    const content = [{ type: 'text', text: debateTopic }];

    // 发送到服务器（需要修改socket emit参数）
    socket.emit(
        SocketEvents.client.sendUserInputToFridayApp,
        'user',
        'user',
        content,
        debateConfig,  // 🆕 传递辩论配置
        (response) => {
            if (!response.success) {
                message.error(response.message);
            }
        }
    );

    // 清空输入
    setDebateTopic('');
};
```

#### 3.3 消息气泡 - 辩论消息特殊显示

**文件**: `packages/client/src/components/chat/bubbles/ReplyBubble/index.tsx`

为辩论消息添加特殊样式：

```tsx
import { Avatar, Tag, Space } from 'antd';
import { UserOutlined, TrophyOutlined } from '@ant-design/icons';

// 检测是否是辩论消息（根据name字段判断）
const isDebateMessage = message.name.startsWith('Debater_') || message.name === 'Moderator';

// 解析辩论者信息
const parseDebaterInfo = (name: string) => {
    if (name === 'Moderator') {
        return { role: 'judge', label: '裁判', color: 'gold' };
    }
    // 例如: Debater_1_Proponent
    const match = name.match(/Debater_(\d+)_(\w+)/);
    if (match) {
        return {
            role: 'debater',
            number: match[1],
            stance: match[2],
            label: `辩手${match[1]}`,
            color: 'blue',
        };
    }
    return null;
};

const debaterInfo = isDebateMessage ? parseDebaterInfo(message.name) : null;

// 渲染辩论消息
{isDebateMessage && debaterInfo ? (
    <div className="debate-message-wrapper">
        <Space className="debate-header" align="center">
            <Avatar
                icon={debaterInfo.role === 'judge' ? <TrophyOutlined /> : <UserOutlined />}
                style={{
                    backgroundColor: debaterInfo.role === 'judge' ? '#faad14' : '#1890ff'
                }}
            />
            <span className="debate-name">{debaterInfo.label}</span>
            {debaterInfo.stance && (
                <Tag color={debaterInfo.color}>{debaterInfo.stance}</Tag>
            )}
            {debaterInfo.role === 'judge' && (
                <Tag color="gold">裁判</Tag>
            )}
        </Space>
        <div className="debate-content">
            <MarkdownRender content={message.content} />
        </div>
    </div>
) : (
    // 普通消息的原有渲染逻辑
    <原有的渲染代码 />
)}
```

**样式文件**: 添加对应的CSS

```css
/* packages/client/src/components/chat/bubbles/index.css */

.debate-message-wrapper {
    border-left: 3px solid #1890ff;
    padding-left: 12px;
    margin-bottom: 16px;
}

.debate-message-wrapper .debate-header {
    margin-bottom: 8px;
    font-weight: 500;
}

.debate-message-wrapper .debate-name {
    font-size: 14px;
    color: rgba(0, 0, 0, 0.85);
}

.debate-message-wrapper .debate-content {
    padding: 8px 0;
    color: rgba(0, 0, 0, 0.75);
}

/* 裁判消息特殊样式 */
.debate-message-wrapper[data-role="judge"] {
    border-left-color: #faad14;
    background-color: #fffbe6;
    padding: 12px;
    border-radius: 4px;
}
```

---

## 测试与验证

### 测试计划

#### 1. 单元测试

**测试文件**: `packages/app/friday/tests/test_debate.py`

```python
import pytest
import asyncio
from debate import DebateOrchestrator, DebateConfig, JudgeModel
from model import get_model, get_formatter

@pytest.mark.asyncio
async def test_debate_config_creation():
    """测试辩论配置创建"""
    config = DebateConfig(num_agents=3, max_rounds=5, topic="Test topic")
    assert config.num_agents == 3
    assert config.max_rounds == 5
    assert len(config.agent_roles) == 3

@pytest.mark.asyncio
async def test_orchestrator_initialization():
    """测试编排器初始化"""
    config = DebateConfig(num_agents=2, max_rounds=3, topic="Test")
    model = get_model("dashscope", "qwen-max", "test-key", None)
    formatter = get_formatter("dashscope")

    orchestrator = DebateOrchestrator(config, model, formatter)
    assert orchestrator.config == config
    assert len(orchestrator.debaters) == 0  # 未create前为空

@pytest.mark.asyncio
async def test_debater_creation():
    """测试辩论者创建"""
    config = DebateConfig(num_agents=2, max_rounds=3, topic="Test")
    model = get_model("dashscope", "qwen-max", "test-key", None)
    formatter = get_formatter("dashscope")

    orchestrator = DebateOrchestrator(config, model, formatter)
    await orchestrator.create_debate_agents()

    assert len(orchestrator.debaters) == 2
    assert orchestrator.debaters[0].name.startswith("Debater_1")

@pytest.mark.asyncio
async def test_judge_model_structure():
    """测试裁判模型结构"""
    judge = JudgeModel(
        finished=True,
        correct_answer="Test answer",
        reasoning="Test reasoning"
    )
    assert judge.finished is True
    assert judge.correct_answer == "Test answer"
```

#### 2. 集成测试

**测试场景**:

1. **完整辩论流程测试**
```bash
python packages/app/friday/main.py \
    --query "[{\"type\":\"text\",\"text\":\"测试问题\"}]" \
    --studio_url "http://localhost:3000" \
    --llmProvider "dashscope" \
    --modelName "qwen-max" \
    --apiKey "your-key" \
    --writePermission "true" \
    --debateMode "true" \
    --debateAgents 2 \
    --debateRounds 2 \
    --debateTopic "React还是Vue更好？"
```

2. **向后兼容测试**（不带辩论参数，应正常运行单智能体模式）
```bash
python packages/app/friday/main.py \
    --query "[{\"type\":\"text\",\"text\":\"普通问题\"}]" \
    --studio_url "http://localhost:3000" \
    --llmProvider "dashscope" \
    --modelName "qwen-max" \
    --apiKey "your-key" \
    --writePermission "true"
```

#### 3. 前后端联调测试

**步骤**:

1. 启动服务器: `npm run dev`
2. 打开Friday页面
3. 在设置中启用辩论模式，配置参数
4. 在聊天界面切换到辩论模式
5. 输入主题: "Python和JavaScript哪个更适合初学者？"
6. 点击"开始辩论"
7. 验证：
   - ✅ 消息实时显示
   - ✅ 辩论者消息有不同样式
   - ✅ 裁判消息突出显示
   - ✅ 辩论结束后显示结论

---

## 部署与配置

### 配置示例

#### 最小配置（2个辩论者，3轮）

```json
{
  "pythonEnv": "python",
  "llmProvider": "dashscope",
  "modelName": "qwen-max",
  "apiKey": "your-api-key",
  "writePermission": true,
  "debateConfig": {
    "enabled": true,
    "agentCount": 2,
    "rounds": 3
  }
}
```

#### 推荐配置（3个辩论者，5轮，更深入讨论）

```json
{
  "pythonEnv": "python",
  "llmProvider": "dashscope",
  "modelName": "qwen-max",
  "apiKey": "your-api-key",
  "writePermission": true,
  "debateConfig": {
    "enabled": true,
    "agentCount": 3,
    "rounds": 5
  }
}
```

### 使用指南

#### 用户操作流程

1. **进入Friday设置页面**
   - 找到"辩论模式配置"区块
   - 开启"启用辩论模式"开关
   - 设置辩论者数量（推荐2-3个）
   - 设置辩论轮数（推荐3-5轮）
   - 保存配置

2. **在聊天界面使用辩论模式**
   - 切换到"辩论模式"
   - 在输入框中输入辩论主题
   - 点击"开始辩论"

3. **观看辩论过程**
   - 实时查看各辩论者的观点
   - 查看裁判的评估
   - 等待最终结论

#### 辩论主题示例

- 技术选型: "微服务架构 vs 单体架构，哪个更适合创业公司？"
- 编程语言: "Go和Rust，后端开发应该选择哪个？"
- 工具选择: "Docker vs Kubernetes，容器编排工具如何选？"
- 设计模式: "单例模式是好的实践还是应该避免？"
- 产品决策: "是否应该在MVP阶段就考虑可扩展性？"

### 成本控制建议

辩论模式会调用多个LLM，成本相对较高：

| 配置 | 每次辩论Token消耗（估算） | 成本（以qwen-max计） |
|------|--------------------------|---------------------|
| 2辩手×3轮 | ~3000-5000 tokens | ¥0.06-0.10 |
| 3辩手×5轮 | ~8000-12000 tokens | ¥0.16-0.24 |
| 5辩手×10轮 | ~20000-30000 tokens | ¥0.40-0.60 |

**节省建议**:
- 使用更便宜的模型作为辩论者（如qwen-plus）
- 控制每个智能体的max_iters
- 合理设置辩论轮数
- 在系统提示词中要求简洁表达

---

## 附录

### A. 完整的依赖列表

```bash
# Python依赖（已在agentscope中包含）
agentscope>=0.1.0
pydantic>=2.0.0

# 无需额外安装
```

### B. 故障排查

| 问题 | 可能原因 | 解决方案 |
|------|---------|---------|
| 辩论无法启动 | 参数传递错误 | 检查args.py中的参数解析 |
| 消息不显示 | Hook未注册 | 确认所有智能体都注册了hook |
| 辩论一直不结束 | 裁判输出格式错误 | 检查JudgeModel定义和output_schema |
| 前端报错 | Socket参数不匹配 | 检查socket.ts中的类型定义 |

### C. 进一步优化方向

1. **辩论主题模板库**: 预设常见辩论主题
2. **智能体个性化**: 允许自定义每个辩论者的立场和风格
3. **观众投票**: 允许用户为辩论者投票
4. **辩论回放**: 保存辩论历史，支持回放
5. **多裁判机制**: 使用多个裁判提高判断准确性
6. **辩论摘要**: 自动生成辩论要点总结
7. **实时图表**: 可视化辩论进度和观点对比

---

## 开发检查清单

### 后端 (Python)

- [ ] ✅ 创建 `debate.py` 文件
  - [ ] ✅ 实现 `JudgeModel` 类
  - [ ] ✅ 实现 `DebateConfig` 类
  - [ ] ✅ 实现 `DebateOrchestrator` 类
  - [ ] ✅ 实现 `run_debate()` 方法
- [ ] ✅ 修改 `args.py`
  - [ ] ✅ 添加 `--debateMode` 参数
  - [ ] ✅ 添加 `--debateAgents` 参数
  - [ ] ✅ 添加 `--debateRounds` 参数
  - [ ] ✅ 添加 `--debateTopic` 参数
  - [ ] ✅ 添加参数验证逻辑
- [ ] ✅ 修改 `main.py`
  - [ ] ✅ 导入 `debate` 模块
  - [ ] ✅ 添加辩论模式分支
  - [ ] ✅ 保持单智能体模式不变
  - [ ] ✅ 添加 `_extract_text_from_content()` 辅助函数

### 服务器 (TypeScript)

- [ ] ✅ 修改 `socket.ts`
  - [ ] ✅ 扩展 `sendUserInputToFridayApp` 事件参数
  - [ ] ✅ 添加辩论参数传递逻辑
- [ ] ✅ 修改 `friday.ts` (配置类型)
  - [ ] ✅ 添加 `debateConfig` 接口定义

### 前端 (React/TypeScript)

- [ ] ✅ 修改设置页面
  - [ ] ✅ 添加辩论模式开关
  - [ ] ✅ 添加辩论者数量滑块
  - [ ] ✅ 添加辩论轮数输入
- [ ] ✅ 修改聊天输入组件
  - [ ] ✅ 添加辩论模式切换开关
  - [ ] ✅ 添加辩论主题输入框
  - [ ] ✅ 实现 `handleSendDebate()` 函数
- [ ] ✅ 修改消息气泡组件
  - [ ] ✅ 添加辩论消息检测逻辑
  - [ ] ✅ 实现辩论消息特殊样式
  - [ ] ✅ 添加裁判消息样式
- [ ] ✅ 添加CSS样式
  - [ ] ✅ `.debate-message-wrapper`
  - [ ] ✅ `.debate-header`
  - [ ] ✅ `.debate-content`

### 测试

- [ ] ✅ 编写单元测试
- [ ] ✅ 编写集成测试
- [ ] ✅ 前后端联调测试
- [ ] ✅ 向后兼容测试

### 文档

- [ ] ✅ 完成开发文档（本文档）
- [ ] ✅ 更新 README.md
- [ ] ✅ 添加使用示例

---

## 联系与反馈

如有问题或建议，请通过以下方式反馈：

- GitHub Issues: [agentscope-studio/issues](https://github.com/agentscope-ai/agentscope-studio/issues)
- 参考文档: https://doc.agentscope.io/tutorial/workflow_multiagent_debate.html

---

**文档版本**: v1.0
**最后更新**: 2025-10-15
**作者**: AgentScope Studio Team
