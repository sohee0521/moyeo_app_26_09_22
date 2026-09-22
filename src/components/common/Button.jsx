import React from "react";

/**
 * MOYEO 공통 버튼 컴포넌트
 *
 * @param {string} variant
 *  - Rectangular: 'primary' | 'secondary' | 'dark'
 *  - Pill: 'pill-light' | 'pill-dark'
 *  - Chip: 'chip-default' | 'chip-primary' | 'chip-outline'
 * @param {string} size - 'sm' | 'md' | 'lg' (기본값: 'md')
 * @param {boolean} disabled
 * @param {React.ReactNode} children
 */
export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  children,
  ...props
}) {
  // 기본 공통 스타일 (트랜지션, 폰트, 인터랙션)
  const baseStyle =
    "inline-flex items-center justify-center font-medium transition-all duration-200 select-none active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100";

  // 1. 모양 및 컬러 Variant
  const variantStyles = {
    // [하단 사각 기본 버튼]
    primary: "!bg-main-blue !text-white rounded-lg hover:opacity-90 shadow-sm",
    secondary: "!bg-light-gray !text-dark-gray rounded-lg hover:bg-[#E5E5E5]",
    dark: "!bg-black !text-white rounded-lg hover:bg-dark-gray shadow-sm",

    // [중단 알약형 캡슐 버튼 (온보딩 등)]
    "pill-light":
      "!bg-light-blue !text-main-blue rounded-full hover:!bg-sub-blue hover:!text-white",
    "pill-dark":
      "!bg-black !text-white rounded-full hover:!bg-dark-gray shadow-sm",

    // [상단 칩/태그 버튼]
    "chip-default":
      "bg-light-gray text-dark-gray rounded-full hover:bg-[#E5E5E5]",
    "chip-primary": "bg-main-blue text-white rounded-full shadow-sm",
    "chip-outline":
      "bg-white text-main-blue border border-sub-blue rounded-full hover:bg-light-blue",
  };

  // 2. 크기 (Variant 유형에 따라 최적화)
  const isChip = variant.startsWith("chip-");
  const isPill = variant.startsWith("pill-");

  let sizeStyle = "";
  if (isChip) {
    sizeStyle = "px-3 py-1 text-xs";
  } else if (isPill) {
    sizeStyle = "px-6 py-3.5 text-sm md:text-base font-semibold";
  } else {
    // 사각 버튼 크기
    const rectSizes = {
      sm: "px-3.5 py-2 text-xs",
      md: "px-5 py-2.5 text-sm",
      lg: "px-6 py-3.5 text-base font-semibold",
    };
    sizeStyle = rectSizes[size] || rectSizes.md;
  }

  return (
    <button
      disabled={disabled}
      className={`${baseStyle} ${variantStyles[variant] || variantStyles.primary} ${sizeStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
