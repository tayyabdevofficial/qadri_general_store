import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeGeneratorProps {
    value: string;
    width?: number;
    height?: number;
    fontSize?: number;
    displayValue?: boolean;
    className?: string;
}

export function BarcodeGenerator({
    value,
    width = 1.5,
    height = 34,
    fontSize = 10,
    displayValue = true,
    className = '',
}: BarcodeGeneratorProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (svgRef.current && value) {
            try {
                JsBarcode(svgRef.current, value, {
                    format: 'CODE128',
                    width: width,
                    height: height,
                    displayValue: displayValue,
                    fontSize: fontSize,
                    fontOptions: 'bold',
                    font: 'monospace',
                    margin: 2,
                    background: '#ffffff',
                    lineColor: '#000000',
                });
            } catch (err) {
                console.error('Invalid barcode value for Code128:', err);
            }
        }
    }, [value, width, height, fontSize, displayValue]);

    if (!value) return null;

    return <svg ref={svgRef} className={`mx-auto ${className}`} />;
}
