import { CSSProperties, memo } from 'react';
import SlotCounter from 'react-slot-counter';
import { Flex } from 'antd';

interface Props {
    number: number;
    style?: CSSProperties;
}

const NumberCounter = ({ number, style = {} }: Props) => {
    return (
        <Flex style={{ ...style }} align={'center'}>
            <SlotCounter
                startValue={0}
                startValueOnce
                value={number.toLocaleString()}
                sequentialAnimationMode
                // useMonospaceWidth
            />
        </Flex>
    );
};

export default memo(NumberCounter);
