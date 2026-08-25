import re

with open('index.html', 'r') as f:
    content = f.read()

target = """        // ==========================================
        // MISSION 1: ROUTINE PATROL
        // ==========================================
"""

replacement = """        let genericCommsTimeout = null;
        function showCommsTransmission(speaker, text, duration) {
            const overlay = document.getElementById('cinematic-comms-overlay');
            const commsBox = document.getElementById('cinematic-comms-box');
            const commsSpeaker = document.getElementById('comms-speaker');
            const commsSubspeaker = document.getElementById('comms-subspeaker');
            const commsSubtitle = document.getElementById('comms-subtitle');
            const commsBadge = document.getElementById('comms-step-badge');
            const commsIcon = document.getElementById('comms-avatar-icon');

            if (overlay) overlay.style.display = 'block';
            if (commsBox) commsBox.className = 'cinematic-comms-box ' + (speaker.includes("ELIAS") ? "speaker-elias" : "speaker-kaylen");
            if (commsSpeaker) commsSpeaker.innerText = speaker;
            if (commsSubspeaker) commsSubspeaker.innerText = "TACTICAL COMMS";
            if (commsSubtitle) commsSubtitle.innerText = `"${text}"`;
            if (commsBadge) commsBadge.innerText = "TRANSMISSION";
            if (commsIcon) commsIcon.innerText = "📻";

            if (genericCommsTimeout) clearTimeout(genericCommsTimeout);
            genericCommsTimeout = setTimeout(() => {
                if (overlay) overlay.style.display = 'none';
            }, duration || 5000);
        }

        // ==========================================
        // MISSION 1: ROUTINE PATROL
        // ==========================================
"""

content = content.replace(target, replacement)

with open('index.html', 'w') as f:
    f.write(content)
