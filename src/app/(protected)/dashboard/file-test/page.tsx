'use client';

import React from 'react';

// This is a minimal test page to debug file upload issues
// It has NO external dependencies, NO complex hooks, just a bare file input

export default function FileUploadTestPage() {
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        console.log('FILE TEST PAGE: onChange triggered');
        const files = event.target.files;
        if (files && files.length > 0) {
            console.log('FILE TEST PAGE: File selected:', files[0].name);
            alert(`SUCCESS! File selected: ${files[0].name}`);
        }
    };

    return (
        <div style={{ padding: '50px', maxWidth: '600px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>
                File Upload Test Page
            </h1>
            <p style={{ marginBottom: '20px', color: '#666' }}>
                This is a minimal test page to debug file upload issues.
                If this page works, the issue is specific to the My Assistants page.
                If this page also reloads, the issue is global.
            </p>

            <div style={{
                padding: '30px',
                border: '3px solid #10b981',
                borderRadius: '10px',
                backgroundColor: '#ecfdf5'
            }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#059669' }}>
                    Test File Input:
                </label>
                <input
                    type="file"
                    accept=".pdf,.docx,.txt,.zip,.jpg,.png"
                    onChange={handleFileChange}
                    style={{
                        display: 'block',
                        width: '100%',
                        padding: '10px',
                        fontSize: '16px'
                    }}
                />
            </div>

            <div style={{
                marginTop: '20px',
                padding: '20px',
                border: '2px dashed #3b82f6',
                borderRadius: '10px',
                backgroundColor: '#eff6ff',
                textAlign: 'center'
            }}>
                <p style={{ color: '#1d4ed8' }}>
                    Try dragging a file here or clicking the input above.
                </p>
            </div>
        </div>
    );
}
