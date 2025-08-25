# -*- coding: utf-8 -*-
from argparse import ArgumentParser, Namespace


def get_args() -> Namespace:
    """Get the command line arguments for the script."""
    parser = ArgumentParser(description="Arguments for friday")
    parser.add_argument(
        "--query",
        type=str,
        required=True,
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
        "--apiKey",
        type=str,
        required=True,
    )
    parser.add_argument(
        "--writePermission",
        type=bool,
        required=True,
    )
    args = parser.parse_args()
    return args
