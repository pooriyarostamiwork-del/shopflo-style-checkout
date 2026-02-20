import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DeliveryAddress, mockAddresses } from "@/data/gptCommerceData";

const GLOBAL_ADDRESSES_KEY = 'flowcart-global-addresses';

const getInitialGlobalAddresses = (): DeliveryAddress[] => {
  try {
    const stored = localStorage.getItem(GLOBAL_ADDRESSES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) { console.error('Failed to load global addresses:', e); }
  return [...mockAddresses];
};

interface UseUserDataProps {
  isAuthenticated: boolean;
}

export const useUserData = ({ isAuthenticated }: UseUserDataProps) => {
  const [globalAddresses, setGlobalAddresses] = useState<DeliveryAddress[]>(() => getInitialGlobalAddresses());
  const [dbOrders, setDbOrders] = useState<any[]>([]);

  // Persist addresses to localStorage when not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      try { localStorage.setItem(GLOBAL_ADDRESSES_KEY, JSON.stringify(globalAddresses)); } catch (e) { console.error(e); }
    }
  }, [globalAddresses, isAuthenticated]);

  // Load addresses from DB when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    const loadAddresses = async () => {
      const { data } = await supabase
        .from('user_addresses')
        .select('*')
        .order('created_at', { ascending: false });
      if (data && data.length > 0) {
        const dbAddresses: DeliveryAddress[] = data.map(a => ({
          id: a.id,
          title: a.title,
          fullAddress: a.full_address,
          recipientName: a.recipient_name,
          phone: a.phone,
          isDefault: a.is_default,
        }));
        setGlobalAddresses(dbAddresses);
      }
    };
    loadAddresses();
  }, [isAuthenticated]);

  // Load orders from DB when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    const loadOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setDbOrders(data);
    };
    loadOrders();
  }, [isAuthenticated]);

  const handleAccountAddAddress = useCallback(async (addr: Omit<DeliveryAddress, "id">) => {
    const id = `addr-${Date.now()}`;
    const created: DeliveryAddress = { id, ...addr };

    if (isAuthenticated) {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return;
      const { data } = await supabase.from('user_addresses').insert({
        user_id: userId,
        title: addr.title,
        full_address: addr.fullAddress,
        recipient_name: addr.recipientName || '',
        phone: addr.phone || '',
        is_default: false,
      }).select().single();
      if (data) created.id = data.id;
    }

    setGlobalAddresses(prev => [created, ...prev]);
  }, [isAuthenticated]);

  const handleAccountDeleteAddress = useCallback(async (addressId: string) => {
    if (isAuthenticated) {
      await supabase.from('user_addresses').delete().eq('id', addressId);
    }
    setGlobalAddresses(prev => prev.filter(a => a.id !== addressId));
  }, [isAuthenticated]);

  const handleAccountUpdateAddress = useCallback(async (address: DeliveryAddress) => {
    if (isAuthenticated) {
      await supabase.from('user_addresses').update({
        title: address.title,
        full_address: address.fullAddress,
        recipient_name: address.recipientName,
        phone: address.phone,
        is_default: address.isDefault,
      }).eq('id', address.id);
    }
    setGlobalAddresses(prev => prev.map(a => a.id === address.id ? address : a));
  }, [isAuthenticated]);

  return {
    globalAddresses,
    setGlobalAddresses,
    dbOrders,
    setDbOrders,
    handleAccountAddAddress,
    handleAccountDeleteAddress,
    handleAccountUpdateAddress,
  };
};
