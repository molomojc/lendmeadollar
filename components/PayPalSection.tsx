'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

interface PayPalSectionProps {
  onSuccessPayment?: (supporterNumber: number, amount: number) => void;
}

export default function PayPalSection({ onSuccessPayment }: PayPalSectionProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string>('');
  const [showNameInput, setShowNameInput] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
  const isConfigured = Boolean(
    clientId &&
    !clientId.includes('your_client_id') &&
    clientId !== 'test_client_id'
  );

  const handleCreateOrder = async () => {
    setErrorMessage(null);
    try {
      const res = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 1.0,
          displayName: displayName || 'Anonymous Legend',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start payment');
      return data.orderId;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error creating order';
      setErrorMessage(msg);
      throw err;
    }
  };

  const handleApprove = async (data: { orderID: string }) => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: data.orderID,
          displayName: displayName || 'Anonymous Legend',
        }),
      });

      const captureData = await res.json();
      if (!res.ok || !captureData.success) {
        throw new Error(captureData.error || 'Capture failed');
      }

      if (onSuccessPayment) {
        onSuccessPayment(captureData.supporterNumber, 1.0);
      }

      router.push(
        `/success?supporterNumber=${captureData.supporterNumber}&amount=1&name=${encodeURIComponent(
          displayName || 'Anonymous Legend'
        )}`
      );
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Payment failed');
      setIsProcessing(false);
    }
  };

  const handleSimulatedPayment = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const createRes = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 1.0,
          displayName: displayName || 'Anonymous Legend',
        }),
      });
      const createData = await createRes.json();

      const captureRes = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: createData.orderId,
          displayName: displayName || 'Anonymous Legend',
        }),
      });
      const captureData = await captureRes.json();

      if (!captureRes.ok || !captureData.success) {
        throw new Error(captureData.error || 'Simulation failed');
      }

      router.push(
        `/success?supporterNumber=${captureData.supporterNumber}&amount=1&name=${encodeURIComponent(
          displayName || 'Anonymous Legend'
        )}`
      );
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error processing simulation');
      setIsProcessing(false);
    }
  };

  return (
    <div id="give" className="w-full max-w-sm mx-auto space-y-4">
      {/* Optional Name Input Toggle */}
      <div className="text-center">
        {!showNameInput ? (
          <button
            type="button"
            onClick={() => setShowNameInput(true)}
            className="text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-4 transition-colors cursor-pointer"
          >
            + Add a nickname (optional)
          </button>
        ) : (
          <div className="space-y-1 text-left">
            <label className="text-[11px] text-zinc-400 block font-mono">YOUR NICKNAME</label>
            <input
              type="text"
              maxLength={30}
              placeholder="Anonymous Legend"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-900 text-red-300 text-xs text-center font-mono">
          {errorMessage}
        </div>
      )}

      {/* Primary Payment Action */}
      <div className="relative">
        {isConfigured ? (
          <PayPalScriptProvider
            options={{
              clientId,
              currency: 'USD',
              intent: 'capture',
            }}
          >
            {isProcessing && (
              <div className="absolute inset-0 bg-black/80 rounded-lg flex items-center justify-center z-10 text-xs text-zinc-300 font-mono">
                Processing payment...
              </div>
            )}
            <PayPalButtons
              style={{
                layout: 'vertical',
                color: 'white',
                shape: 'rect',
                label: 'pay',
                height: 48,
              }}
              createOrder={handleCreateOrder}
              onApprove={handleApprove}
            />
          </PayPalScriptProvider>
        ) : (
          <button
            type="button"
            onClick={handleSimulatedPayment}
            disabled={isProcessing}
            className="w-full py-4 px-6 rounded-xl bg-white hover:bg-zinc-200 active:scale-[0.99] text-black font-extrabold text-base tracking-tight transition-all shadow-lg hover:shadow-xl cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? 'PROCESSING...' : 'GIVE $1'}
          </button>
        )}
      </div>

      {!isConfigured && (
        <p className="text-[11px] text-zinc-600 text-center font-mono">
          (Running in demo simulation mode &bull; gives instant $1 test)
        </p>
      )}
    </div>
  );
}
