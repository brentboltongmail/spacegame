        // --- REALTIME SERVER DEBUG LOGGER HELPER ---
        function remoteLog(msg) {
            console.log("[MAP DEBUG]", msg);
            try {
                fetch('/api/log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: msg })
                }).catch(() => {});
            } catch(err) {}
        }

        window.addEventListener('error', (e) => {
            console.error("Global JS Error:", e);
            remoteLog(`GLOBAL JS ERROR: ${e.message} at ${e.filename}:${e.lineno}:${e.colno}`);
            // Ignore generic cross-origin "Script error." placeholders that provide no stack or line info
            if (!e.message || e.message === 'Script error.' || e.lineno === 0) return;
        });

        window.addEventListener('unhandledrejection', (e) => {
            console.warn("Unhandled Promise Rejection:", e.reason);
            remoteLog(`UNHANDLED PROMISE REJECTION: ${e.reason}`);
        });

