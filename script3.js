(async function () {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const labelBox = document.getElementById('label-box');
    const ctx = canvas.getContext('2d');

    // Only detect 'person'
    const targetObject = 'person';

    // Start the camera
    const startCamera = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        });
        video.srcObject = stream;
        await new Promise((resolve) => (video.onloadedmetadata = resolve));
        video.play();
    };

    // Main detection loop
    const detectObjects = async (model) => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        while (true) {
            const predictions = await model.detect(video);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            let personDetected = false;

            predictions.forEach((pred) => {
                if (pred.class === targetObject) {
                    personDetected = true;
                    const [x, y, width, height] = pred.bbox;

                    // Draw bounding box and label
                    ctx.strokeStyle = 'red';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, width, height);
                    ctx.fillStyle = 'red';
                    ctx.font = '16px Arial';
                    ctx.fillText('enemy spotted', x, y - 5);
                }
            });

            labelBox.textContent = personDetected ? 'enemy spotted' : 'No enemy';

            // Send '1' to WebViewer only when person is detected
            if (window.AppInventor) {
                window.AppInventor.setWebViewString(personDetected ? '1' : '0');
            }

            await tf.nextFrame();
        }
    };

    await startCamera();
    const model = await cocoSsd.load();
    detectObjects(model);
})();
