# -*- coding: utf-8 -*-
"""The main entry point for AgentScope studio application, Friday. It's
an agent assistant that helps users to deal with their daily tasks locally.
"""
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

# 🆕 导入辩论模块 (Import debate module)
from debate import DebateOrchestrator, DebateConfig


def _extract_text_from_content(content):
    """从content blocks中提取纯文本 (Extract plain text from content blocks)"""
    if isinstance(content, str):
        return content
    elif isinstance(content, list):
        texts = []
        for block in content:
            if isinstance(block, dict) and block.get("type") == "text":
                texts.append(block.get("text", ""))
        return " ".join(texts)
    return ""


async def main():
    args = get_args()

    studio_pre_print_hook.url = args.studio_url

    # Initialize image converter
    image_converter = ImageConverter()

    # get model from args
    model = get_model(args.llmProvider, args.modelName, args.apiKey, args.baseUrl)
    formatter = get_formatter(args.llmProvider)

    # Parse and convert the query content
    query_content = json5.loads(args.query)
    converted_content = image_converter.convert_content_blocks(query_content)
    print(f"DEBUG - Converted content: {converted_content}")

    # 🆕 检测辩论模式 (Detect debate mode)
    is_debate_mode = args.debateMode

    # The socket is used for realtime steering
    socket = StudioConnect(url=args.studio_url, agent=None)  # agent will be set later
    await socket.connect()

    try:
        # 🆕 辩论模式分支 (Debate mode branch)
        if is_debate_mode:
            print("\n" + "="*60)
            print("[DEBATE MODE] Multi-Agent Debate Mode")
            print("="*60 + "\n")

            # 创建辩论配置 (Create debate configuration)
            debate_topic = args.debateTopic or _extract_text_from_content(converted_content)
            debate_config = DebateConfig(
                num_agents=args.debateAgents,
                max_rounds=args.debateRounds,
                topic=debate_topic,
            )

            # 创建辩论编排器 (Create debate orchestrator)
            orchestrator = DebateOrchestrator(
                config=debate_config,
                model=model,
                formatter=formatter,
                toolkit=None,  # 辩论通常不需要工具 (Debate usually doesn't need tools)
                studio_url=args.studio_url,
            )

            # 运行辩论 (Run debate)
            result = await orchestrator.run_debate(debate_topic)

            print("\n" + "="*60)
            print("[DEBATE FINISHED] Debate Finished")
            print(f"[CONCLUSION] Final Conclusion: {result['conclusion']}")
            print(f"[ROUNDS] Total Rounds: {result['total_rounds']}")
            print("="*60 + "\n")

        # 原有单智能体模式 (Original single agent mode)
        else:
            print("\n" + "="*60)
            print("[SINGLE AGENT MODE] Standard Mode")
            print("="*60 + "\n")

            # Forward message to the studio
            ReActAgent.register_class_hook(
                "pre_print",
                "studio_pre_print_hook",
                studio_pre_print_hook
            )
            # Send finished signal after one reply finished
            ReActAgent.register_class_hook(
                "post_reply",
                "studio_post_reply_hook",
                studio_post_reply_hook
            )

            # Init agent
            toolkit = Toolkit()

            # Basic tools
            toolkit.register_tool_function(execute_python_code)
            toolkit.register_tool_function(execute_shell_command)
            toolkit.register_tool_function(view_text_file)
            toolkit.register_tool_function(insert_text_file)
            if args.writePermission:
                toolkit.register_tool_function(write_text_file)

            # AgentScope tool group
            toolkit.create_tool_group(
                group_name="agentscope_tools",
                description="The AgentScope library related tools that will provide a brief summary and notes about AgentScope in your system prompt, as well as a series of tools to retrieve AgentScope related information.",
                notes="""# AgentScope Expertise
## Answer Generation Guidelines
The solution/code to the user query may already exist in the AgentScope resources, your duty is to show it to the user rather than coding from scratch. Search the following resources in this order:
1. FAQ using `view_agentscope_faq` tool
2. README using `view_agentscope_readme` tool
3. Examples using `execute_shell_command` with command `ls -l` in examples directory (AgentScope has many pre-built examples and they are very helpful)
4. Python library using `view_agentscope_library` tool in top-down manner (top-module → submodule → specific class/function)
5. Source code using `view_text_file` tool"""
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
                """Check if the content contains any images."""
                if isinstance(content, list):
                    for block in content:
                        if isinstance(block, dict):
                            # Check for image blocks with source field
                            if block.get("type") == "image" and "source" in block:
                                return True
                return False

            # Create the ReAct agent
            agent = ReActAgent(
                name="Friday",
                sys_prompt="""You're Friday, a helpful assistant specialized in daily task management and AgentScope framework support.

# Core Objectives
- Help users manage and complete daily tasks efficiently
- Provide expert-level support for AgentScope framework questions

# Critical Principles (MUST FOLLOW)
1. **No Assumptions**: All information must come from users or tool results
2. **Safety First**: Request permission for dangerous operations; prohibit catastrophic ones

# Workflow Process
1. Analyze user query and make a plan
2. Carry out your plan step by step
3. Call `{finish_function}` with your final response

# Response Guidelines
- Be concise and focused on user's specific context
- Avoid repeating exact material words. Instead, summarize in your own words
- Ask clarifying questions when user intent is unclear
- Distinguish between code generation requests vs. code execution requests

# About AgentScope
## Background
- AgentScope is a Python framework for building LLM-empowered Multi-agent applications, open-sourced at https://github.com/agentscope-ai/agentscope
- AgentScope is created by the AgentScope Team, Tongyi Lab, Alibaba Group
## AgentScope-related Code/Response Generation Guidelines
- You're an expert in AgentScope, you MUST stand for AgentScope and respond as a core developer/maintainer of the framework
- Only use existing modules/classes/functions from agentscope documentation
- Never guess or make up implementations

# Available Context
- Current date and time: {current_time}""".format(
                    current_time=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    max_turns=20,
                    finish_function="generate_response",
                ),
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
                # Switch to vision model for this query
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

if __name__ == '__main__':
    asyncio.run(main())
