'use strict';
'use client';

import React, { useEffect, useRef } from 'react';

export type DeliveryAddress = {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};

export type UserProfile = {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  isLoggedIn: boolean;
  delivery_address?: DeliveryAddress;
};

export const GUEST_USER: UserProfile = {
  name: '',
  email: '',
  phone: '',
  avatar: '',
  isLoggedIn: false,
};

declare global {
  interface Window {
    google?: any;
    __gsiInitialized?: boolean;
  }
}

export function parseGoogleJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

type Props = {
  onSuccess: (user: UserProfile) => void;
  theme?: 'light' | 'dark';
};

export default function GoogleSignInRender({ onSuccess, theme = 'dark' }: Props) {
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const isLight = theme === 'light';
  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    '69996615501-m4eclgq75cl1qd0q6kqckspg7q066epg.apps.googleusercontent.com';

  useEffect(() => {
    let checkInterval: NodeJS.Timeout;

    const initGsi = () => {
      if (typeof window === 'undefined' || !window.google?.accounts?.id || !clientId) return;

      try {
        if (!window.__gsiInitialized) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response: any) => {
              if (response?.credential) {
                const data = parseGoogleJwt(response.credential);
                if (data) {
                  const updated: UserProfile = {
                    name: data.name || data.given_name || 'Google User',
                    email: data.email || '',
                    phone: '',
                    avatar: data.picture || '',
                    isLoggedIn: true,
                    delivery_address: undefined,
                  };
                  onSuccessRef.current(updated);
                }
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
            use_fedcm_for_prompt: false,
          });
          window.__gsiInitialized = true;
        }

        if (googleBtnRef.current) {
          googleBtnRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: isLight ? 'outline' : 'filled_black',
            size: 'large',
            shape: 'pill',
            text: 'signin_with',
            logo_alignment: 'left',
            width: 250,
          });
        }
      } catch (err) {
        console.warn('Google Identity notice:', err);
      }
    };

    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      initGsi();
    } else {
      checkInterval = setInterval(() => {
        if (typeof window !== 'undefined' && window.google?.accounts?.id) {
          clearInterval(checkInterval);
          initGsi();
        }
      }, 200);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [clientId, isLight]);

  return <div ref={googleBtnRef} className="min-h-[44px] flex items-center justify-center" />;
}
