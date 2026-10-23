import type * as AlphaTab from '@coderline/alphatab';

// alphaTab is loaded as a classic <script> from the CDN, which exposes the library on window.alphaTab
declare global {
  interface Window {
    alphaTab?: typeof AlphaTab;
  }
}

export {};
