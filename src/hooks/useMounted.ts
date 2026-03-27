import React, { useState, useEffect } from 'react';

function useMounted() {
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    // The component is mounted when useEffect runs for the first time
    setMounted(true);

    // Cleanup function to mark the component as unmounted
    return () => {
      setMounted(false);
    };
  }, []);

  return mounted;
}

export default useMounted;
