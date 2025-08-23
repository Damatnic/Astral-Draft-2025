
import React from 'react';
import { animate } from 'framer-motion';

interface AnimatedNumberProps {
    value: number;
}

const AnimatedNumber = ({ value }: AnimatedNumberProps) => {
    const ref = React.useRef<HTMLSpanElement>(null);

    React.useEffect(() => {
        const node = ref.current;
        if (!node) return;

        const fromValue = parseFloat(node.textContent || "0");
        const controls = animate(fromValue, value, {
            duration: 0.8,
            ease: "easeOut",
            onUpdate(value) {
                node.textContent = value.toFixed(value % 1 === 0 ? 0 : 1);
            },
        });

        return () => controls.stop();
    }, [value]);

    return <span ref={ref}>{value}</span>;
};

export default AnimatedNumber;