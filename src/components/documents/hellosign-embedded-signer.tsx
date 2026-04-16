'use client';

import { useEffect, useRef } from 'react';
import HelloSign from 'hellosign-embedded';

interface HelloSignEmbeddedSignerProps {
    documentId: string | number;
    embeddedSignUrl: string;
    onSigningComplete: () => void;
}

export function HelloSignEmbeddedSigner({
    documentId,
    embeddedSignUrl,
    onSigningComplete
}: HelloSignEmbeddedSignerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const clientRef = useRef<any>(null);

    useEffect(() => {
        // Only initialize and open if we have the URL and container
        if (embeddedSignUrl && containerRef.current && !clientRef.current) {
            const clientId = process.env.NEXT_PUBLIC_HELLOSIGN_CLIENT_ID;

            if (!clientId) {
                console.error('NEXT_PUBLIC_HELLOSIGN_CLIENT_ID is not defined');
                return;
            }

            try {
                const client = new HelloSign({
                    clientId: clientId
                });

                clientRef.current = client;

                client.open(embeddedSignUrl, {
                    clientId: clientId,
                    skipDomainVerification: true,
                    container: containerRef.current,
                    testMode: true
                });

                client.on('sign', (data: any) => {
                    console.log('Document signed:', data);
                    onSigningComplete();
                });

                client.on('cancel', () => {
                    console.log('Signing cancelled');
                });

                client.on('error', (data: any) => {
                    console.error('HelloSign error:', data);
                });

            } catch (error) {
                console.error('Failed to initialize HelloSign:', error);
            }
        }

        // Cleanup if necessary
        return () => {
            if (clientRef.current) {
                // clientRef.current.close(); // If there is a close method
                clientRef.current = null;
            }
        };

    }, [embeddedSignUrl, onSigningComplete]);

    return (
        <div className="w-full h-full min-h-[500px] border rounded-md overflow-hidden bg-white flex flex-col">
            <div
                ref={containerRef}
                className="w-full h-full flex-1 min-h-0"
                id="hellosign-container"
            />
        </div>
    );
}
