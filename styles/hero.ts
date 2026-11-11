import { heroui } from '@heroui/react'

export default heroui({
  themes: {
    // ===== 浅色主题 - Galgame 风格 =====
    light: {
      extend: 'light',
      colors: {
        background: '#fcf0f0',
        foreground: '#2a1f1a',

        primary: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843'
        },

        default: {
          50: '#faf5f0',
          100: '#f0ebe5',
          200: '#e0d8d0',
          300: '#c8c0b8',
          400: '#a8a098',
          500: '#888078',
          600: '#686058',
          700: '#484038',
          800: '#28201a',
          900: '#1a100a'
        }
      }
    },
    // ===== 深色主题 - Galgame 暗色风格 =====
    dark: {
      extend: 'dark',
      colors: {
        background: '#1a1a2e', // 深紫黑
        foreground: '#f0e6d3', // 奶油白

        primary: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843'
        },

        default: {
          50: '#2a2a3e',
          100: '#35354a',
          200: '#4a4a60',
          300: '#6a6a85',
          400: '#8a8aa0',
          500: '#a8a0b0',
          600: '#c8c0d0',
          700: '#e0d8e8',
          800: '#f0e8f5',
          900: '#faf5ff'
        }
      }
    }
  }
})
