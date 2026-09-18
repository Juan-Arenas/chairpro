'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/lib/store';
import type { Barbershop, Appointment, Notification } from '@/types';

/**
 * Hook para escuchar cambios en Supabase Realtime y sincronizar
 * el store de Zustand automáticamente.
 */
export function useSupabaseRealtime(shopId?: string) {
  const { mode, currentShop, updateShopBranding, appointments } = useStore();

  useEffect(() => {
    if (mode !== 'live') return;

    const supabase = createClient();
    const activeShopId = shopId || currentShop?.id;

    // Channel para suscripciones en vivo
    const channel = supabase
      .channel(`realtime_shop_${activeShopId || 'global'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tenants',
        },
        (payload: any) => {
          if (payload.new && payload.new.id === activeShopId) {
            const newTenant = payload.new;
            // Sincronizar tema y datos de la barbería en vivo
            if (newTenant.theme) {
              updateShopBranding(newTenant.id, {
                name: newTenant.name,
                ...newTenant.theme,
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments',
          filter: activeShopId ? `tenant_id=eq.${activeShopId}` : undefined,
        },
        (payload: any) => {
          const newRow = payload.new;
          if (newRow) {
            const store = useStore.getState();
            const exists = store.appointments.some((a) => a.id === newRow.id);
            if (!exists) {
              const mappedAppt: Appointment = {
                id: newRow.id,
                shopId: newRow.tenant_id,
                clientId: newRow.client_id,
                barberId: newRow.barber_id,
                serviceId: newRow.service_id,
                date: newRow.date,
                startTime: newRow.start_time?.slice(0, 5) || '',
                endTime: newRow.end_time?.slice(0, 5) || '',
                status: newRow.status,
                source: newRow.source,
                price: Number(newRow.price),
                commissionAmount: Number(newRow.commission_amount) || 0,
                isPaid: newRow.is_paid || false,
                paymentMethod: newRow.payment_method,
                notes: newRow.notes,
                reminderSent: newRow.reminder_sent || false,
                createdAt: newRow.created_at,
                updatedAt: newRow.updated_at,
              };

              useStore.setState({
                appointments: [mappedAppt, ...store.appointments],
              });

              store.addNotification({
                shopId: newRow.tenant_id,
                type: 'new_appointment',
                title: 'Nueva Cita en Tiempo Real',
                message: `Reserva recibida para el ${newRow.date} a las ${newRow.start_time?.slice(0, 5)}.`,
                isRead: false,
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments',
          filter: activeShopId ? `tenant_id=eq.${activeShopId}` : undefined,
        },
        (payload: any) => {
          const updatedRow = payload.new;
          if (updatedRow) {
            const store = useStore.getState();
            useStore.setState({
              appointments: store.appointments.map((a) =>
                a.id === updatedRow.id
                  ? {
                      ...a,
                      status: updatedRow.status,
                      isPaid: updatedRow.is_paid,
                      paymentMethod: updatedRow.payment_method,
                      updatedAt: updatedRow.updated_at,
                    }
                  : a
              ),
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Supabase Realtime] Conectado al canal para shop: ${activeShopId || 'global'}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mode, currentShop?.id, shopId, updateShopBranding]);
}
