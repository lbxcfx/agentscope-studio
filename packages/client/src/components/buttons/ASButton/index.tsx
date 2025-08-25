import { memo, ReactNode, RefObject } from 'react';
import { Button, ButtonProps, Tooltip } from 'antd';
import { TooltipPlacement } from 'antd/lib/tooltip';

interface Props extends ButtonProps {
    ref?: RefObject<null> | undefined;
    tooltip: string;
    placement?: TooltipPlacement;
}

const PrimaryButton = memo(
    ({ ref = undefined, tooltip, ...restProps }: Props) => {
        return (
            <Tooltip title={tooltip}>
                <Button
                    ref={ref}
                    color={'default'}
                    type={'primary'}
                    style={{
                        borderRadius: '1rem',
                    }}
                    {...restProps}
                />
            </Tooltip>
        );
    },
);

const SecondaryButton = ({
    tooltip,
    placement = 'top',
    ...restProps
}: Props) => {
    return (
        <Tooltip title={tooltip} placement={placement}>
            <Button color={'default'} type={'default'} {...restProps} />
        </Tooltip>
    );
};

interface SwitchButtonProps extends ButtonProps {
    tooltip: string;
    title?: string;
    activeIcon?: ReactNode;
    inactiveIcon?: ReactNode;
    active: boolean;
}

const SwitchButton = ({
    tooltip,
    title,
    activeIcon,
    inactiveIcon,
    active,
    ...restProps
}: SwitchButtonProps) => {
    const bgColor = active ? 'var(--secondary)' : 'transparent';
    const color = active ? 'var(--secondary-foreground)' : 'var(--hint-color)';

    return (
        <Tooltip title={tooltip}>
            <Button
                style={{ background: bgColor, color: color }}
                icon={active ? activeIcon : inactiveIcon}
                className={'as-switch-button'}
                {...restProps}
            >
                {title}
            </Button>
        </Tooltip>
    );
};

export { PrimaryButton, SecondaryButton, SwitchButton };
