(async function () {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const labelBox = document.getElementById('label-box');
    const ctx = canvas.getContext('2d');

    // List of objects to detect
    const allowedObjects = ['person', 'car', 'bicycle', 'bus', 'traffic light', 'stop sign', 'motorcycle', 'truck'];

    // Start the camera
    const startCamera = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        });
        video.srcObject = stream;
        await new Promise((resolve) => (video.onloadedmetadata = resolve));
        video.play();
    };

    // Determine direction based on x-coordinate
    const getDirectionCode = (x, width) => (x < width / 3 ? 1 : x > (2 * width) / 3 ? 3 : 2);

    // Main detection loop
    const detectObjects = async (model) => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        while (true) {
            const predictions = await model.detect(video);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            let directionCode = 0; // Default value if no relevant object is detected

            predictions.forEach((pred) => {
                if (allowedObjects.includes(pred.class)) {
                    const [x, y, width, height] = pred.bbox;
                    directionCode = getDirectionCode(x + width / 2, canvas.width); // Determine direction

                    // Draw bounding box and label
                    ctx.strokeStyle = 'red';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, width, height);
                    ctx.fillStyle = 'red';
                    ctx.font = '16px Arial';
                    ctx.fillText(`Dir: ${directionCode}`, x, y - 5);
                }
            });

            labelBox.textContent = directionCode ? `${directionCode}` : 'No relevant object detected';

            if (window.AppInventor) {
                window.AppInventor.setWebViewString(directionCode.toString());
            }

            await tf.nextFrame();
        }
    };

    await startCamera();
    const model = await cocoSsd.load();
    detectObjects(model);
})();
