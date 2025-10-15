# -*- coding: utf-8 -*-
from argparse import ArgumentParser, Namespace


def get_args() -> Namespace:
    """Get the command line arguments for the script."""
    parser = ArgumentParser(description="Arguments for friday")
    parser.add_argument(
        "--query",
        type=str,
        required=False,
    )
    parser.add_argument(
        "--query-file",
        type=str,
        required=False,
        help="Path to a file containing the query content (alternative to --query)"
    )
    parser.add_argument(
        "--studio_url",
        type=str,
        required=True,
    )
    parser.add_argument(
        "--llmProvider",
        choices=["dashscope", "openai", "anthropic", "gemini", "ollama"],
        required=True,
    )
    parser.add_argument(
        "--modelName",
        type=str,
        required=True,
    )
    parser.add_argument(
        "--visionModelName",
        type=str,
        required=False,
    )
    parser.add_argument(
        "--apiKey",
        type=str,
        required=True,
    )
    parser.add_argument(
        "--writePermission",
        type=bool,
        required=True,
    )
    parser.add_argument(
        "--baseUrl",
        type=str,
        required=False,
    )

    # 🆕 新增辩论模式参数 (New debate mode parameters)
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

    # Validate that either query or query_file is provided
    if not args.query and not args.query_file:
        parser.error("Either --query or --query-file must be provided")

    # 辩论参数验证 (Debate parameter validation)
    if args.debateMode:
        if not (2 <= args.debateAgents <= 5):
            parser.error("debateAgents must be between 2 and 5")
        if not (1 <= args.debateRounds <= 10):
            parser.error("debateRounds must be between 1 and 10")
        if not args.debateTopic and not args.query:
            parser.error("debateTopic or query must be provided in debate mode")

    return args
