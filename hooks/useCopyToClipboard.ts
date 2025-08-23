import React from 'react';

export default function useCopyToClipboard() {
  const copy = React.useCallback(async (text: string) => {
    if (!navigator?.clipboard) {
      console.warn('Clipboard not supported');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.warn('Copy failed', error);
    }
  }, []);

  return { copy };
}
