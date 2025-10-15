# -*- coding: utf-8 -*-
"""Image converter utility for converting frontend ImageBlock format to AgentScope format."""
from typing import Any, Dict


class ImageConverter:
    """Pass through frontend ImageBlock format to AgentScope (formatters handle conversion)."""

    def __init__(self):
        """Initialize the image converter."""
        pass

    def convert_content_blocks(self, content: Any) -> Any:
        """
        Convert frontend ContentBlocks format to AgentScope format.

        Args:
            content: The content from frontend, can be string or list of blocks

        Returns:
            Converted content in AgentScope format
        """
        # If content is a string, return as is
        if isinstance(content, str):
            return content

        # If content is a list, process each block
        if isinstance(content, list):
            converted_blocks = []
            for block in content:
                converted_block = self._convert_block(block)
                if converted_block is not None:
                    converted_blocks.append(converted_block)
            return converted_blocks

        return content

    def _convert_block(self, block: Dict[str, Any]) -> Dict[str, Any] | None:
        """
        Convert a single content block.

        Args:
            block: A single content block from frontend

        Returns:
            Converted block (passed through as-is, AgentScope formatters handle the conversion)
        """
        # AgentScope formatters handle the image source conversion themselves
        # We just pass through the blocks as-is
        return block

    def cleanup(self):
        """Cleanup method (no-op since we don't create temporary files anymore)."""
        pass
