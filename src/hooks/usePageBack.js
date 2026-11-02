import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Detail-page controls share browser history; a direct link has a useful fallback.
// Native Back is registered once by Layout's useAppBack, not by each page.
export default function usePageBack(fallback = '/') {
  const navigate = useNavigate();
  return useCallback(() => {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigate(fallback, { replace: true });
  }, [navigate, fallback]);
}
