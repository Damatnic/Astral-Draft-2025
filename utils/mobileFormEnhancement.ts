// Mobile Form Enhancement Utility
// Automatically enhances form inputs with proper attributes for mobile usability

import React from 'react';

export interface FormEnhancementOptions {
  enableAutocomplete?: boolean;
  enableInputMode?: boolean;
  enableMobileKeyboards?: boolean;
}

/**
 * Enhances form inputs with mobile-optimized attributes
 * Call this function on form containers to automatically enhance all inputs
 */
export function enhanceFormForMobile(
  formElement: HTMLFormElement | HTMLElement,
  options: FormEnhancementOptions = {}
) {
  const {
    enableAutocomplete = true,
    enableInputMode = true,
    enableMobileKeyboards = true
  } = options;

  if (!formElement) return;

  // Get all input elements within the form
  const inputs = formElement.querySelectorAll('input, textarea');

  inputs.forEach((input) => {
    const inputElement = input as HTMLInputElement | HTMLTextAreaElement;
    
    // Skip if already enhanced
    if (inputElement.dataset.mobileEnhanced === 'true') return;
    
    enhanceInput(inputElement, { enableAutocomplete, enableInputMode, enableMobileKeyboards });
    
    // Mark as enhanced to avoid duplicate processing
    inputElement.dataset.mobileEnhanced = 'true';
  });
}

/**
 * Enhances a single input element with mobile-optimized attributes
 */
export function enhanceInput(
  input: HTMLInputElement | HTMLTextAreaElement,
  options: FormEnhancementOptions = {}
) {
  const {
    enableAutocomplete = true,
    enableInputMode = true,
    enableMobileKeyboards = true
  } = options;

  if (!input) return;

  const placeholder = input.placeholder?.toLowerCase() || '';
  const name = input.name?.toLowerCase() || '';
  const id = input.id?.toLowerCase() || '';
  const type = input.type?.toLowerCase() || '';

  // Set input modes for better mobile keyboards
  if (enableInputMode && enableMobileKeyboards) {
    setInputMode(input, placeholder, name, id, type);
  }

  // Set autocomplete attributes
  if (enableAutocomplete) {
    setAutocomplete(input, placeholder, name, id, type);
  }

  // Set specific input types for better mobile experience
  if (enableMobileKeyboards) {
    optimizeInputType(input, placeholder, name, id);
  }

  // Ensure minimum font size to prevent zoom on iOS
  if (!input.style.fontSize || parseInt(input.style.fontSize) < 16) {
    input.style.fontSize = '16px';
  }
}

/**
 * Sets appropriate input mode for mobile keyboards
 */
function setInputMode(
  input: HTMLInputElement | HTMLTextAreaElement,
  placeholder: string,
  name: string,
  id: string,
  type: string
) {
  // Skip if already has inputmode
  if (input.getAttribute('inputmode')) return;

  if (type === 'email' || placeholder.includes('email') || name.includes('email') || id.includes('email')) {
    input.setAttribute('inputmode', 'email');
  } else if (type === 'tel' || placeholder.includes('phone') || placeholder.includes('tel') || name.includes('phone') || name.includes('tel')) {
    input.setAttribute('inputmode', 'tel');
  } else if (type === 'url' || placeholder.includes('url') || placeholder.includes('website') || placeholder.includes('http')) {
    input.setAttribute('inputmode', 'url');
  } else if (
    type === 'number' || 
    placeholder.includes('number') || 
    placeholder.includes('%') || 
    placeholder.includes('score') || 
    placeholder.includes('point') ||
    placeholder.includes('prediction') ||
    placeholder.includes('training') ||
    placeholder.includes('validation')
  ) {
    input.setAttribute('inputmode', 'numeric');
  } else if (
    placeholder.includes('search') || 
    name.includes('search') || 
    id.includes('search')
  ) {
    input.setAttribute('inputmode', 'search');
  }
}

/**
 * Sets appropriate autocomplete attributes
 */
function setAutocomplete(
  input: HTMLInputElement | HTMLTextAreaElement,
  placeholder: string,
  name: string,
  id: string,
  type: string
) {
  // Skip if already has autocomplete
  if (input.getAttribute('autocomplete')) return;

  if (type === 'email' || name === 'email' || id === 'email') {
    input.setAttribute('autocomplete', 'email');
  } else if (type === 'password' && (name.includes('confirm') || id.includes('confirm'))) {
    input.setAttribute('autocomplete', 'new-password');
  } else if (type === 'password') {
    input.setAttribute('autocomplete', 'current-password');
  } else if (name === 'username' || id === 'username') {
    input.setAttribute('autocomplete', 'username');
  } else if (name.includes('name') || id.includes('name')) {
    if (name.includes('first') || id.includes('first')) {
      input.setAttribute('autocomplete', 'given-name');
    } else if (name.includes('last') || id.includes('last')) {
      input.setAttribute('autocomplete', 'family-name');
    } else {
      input.setAttribute('autocomplete', 'name');
    }
  } else if (name.includes('phone') || id.includes('phone') || type === 'tel') {
    input.setAttribute('autocomplete', 'tel');
  } else if (placeholder.includes('search')) {
    input.setAttribute('autocomplete', 'off');
  }
}

/**
 * Optimizes input type for better mobile experience
 */
function optimizeInputType(
  input: HTMLInputElement | HTMLTextAreaElement,
  placeholder: string,
  name: string,
  id: string
) {
  // Only change if it's a generic text input
  if (input.type !== 'text') return;

  if (placeholder.includes('email') || name.includes('email') || id.includes('email')) {
    (input as HTMLInputElement).type = 'email';
  } else if (placeholder.includes('url') || placeholder.includes('website') || placeholder.includes('http')) {
    (input as HTMLInputElement).type = 'url';
  } else if (placeholder.includes('phone') || placeholder.includes('tel')) {
    (input as HTMLInputElement).type = 'tel';
  } else if (placeholder.includes('search') || name.includes('search') || id.includes('search')) {
    (input as HTMLInputElement).type = 'search';
  }
}

/**
 * React hook for automatically enhancing forms in components
 */
export function useMobileFormEnhancement(
  formRef: React.RefObject<HTMLFormElement | HTMLElement>,
  options: FormEnhancementOptions = {}
) {
  React.useEffect(() => {
    if (formRef.current) {
      enhanceFormForMobile(formRef.current, options);
    }
  }, [formRef, options]);
}

/**
 * React hook for enhancing a single input
 */
export function useMobileInputEnhancement(
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>,
  options: FormEnhancementOptions = {}
) {
  React.useEffect(() => {
    if (inputRef.current) {
      enhanceInput(inputRef.current, options);
    }
  }, [inputRef, options]);
}

// Auto-enhancement for document (call once in app initialization)
export function initializeGlobalFormEnhancement(options: FormEnhancementOptions = {}) {
  // Enhanced on DOM content loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      enhanceAllFormsInDocument(options);
    });
  } else {
    enhanceAllFormsInDocument(options);
  }

  // Watch for dynamically added forms
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          
          // Check if the added element is a form or contains forms
          if (element.tagName === 'FORM') {
            enhanceFormForMobile(element as HTMLFormElement, options);
          } else {
            const forms = element.querySelectorAll('form, [data-form-container]');
            forms.forEach((form) => {
              enhanceFormForMobile(form as HTMLFormElement, options);
            });
          }
          
          // Also check for individual inputs
          const inputs = element.querySelectorAll('input, textarea');
          inputs.forEach((input) => {
            enhanceInput(input as HTMLInputElement | HTMLTextAreaElement, options);
          });
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  return () => observer.disconnect();
}

/**
 * Enhances all forms currently in the document
 */
function enhanceAllFormsInDocument(options: FormEnhancementOptions = {}) {
  // Enhance all forms
  const forms = document.querySelectorAll('form, [data-form-container]');
  forms.forEach((form) => {
    enhanceFormForMobile(form as HTMLFormElement, options);
  });

  // Enhance standalone inputs
  const inputs = document.querySelectorAll('input:not(form input), textarea:not(form textarea)');
  inputs.forEach((input) => {
    enhanceInput(input as HTMLInputElement | HTMLTextAreaElement, options);
  });
}
