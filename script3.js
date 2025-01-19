(async function () {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const labelBox = document.getElementById('label-box');
    const ctx = canvas.getContext('2d');

    const objectMapping = {
        person: 1,
        car: 2,
        bicycle: 3,
        bus: 4,
        traffic_light: 5,
        stop_sign: 6,
        motorcycle: 7,
        truck: 8,
    };

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

            const result = predictions
                .map((pred) => {
                    const [x, y, width, height] = pred.bbox;
                    const objectNumber = objectMapping[pred.class];
                    const directionCode = getDirectionCode(x + width / 2, canvas.width);

                    // Draw bounding box and label
                    ctx.strokeStyle = 'red';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, width, height);
                    ctx.fillStyle = 'red';
                    ctx.font = '16px Arial';
                    ctx.fillText(`${pred.class} (${Math.round(pred.score * 100)}%)`, x, y - 5);

                    return objectNumber ? `${objectNumber}${directionCode}` : null;
                })
                .filter((item) => item)
                .join('');

            labelBox.textContent = result || 'No relevant objects detected';

            if (window.AppInventor) {
                window.AppInventor.setWebViewString(result);
            }

            await tf.nextFrame();
        }
    };

    await startCamera();
    const model = await cocoSsd.load();
    detectObjects(model);
})();
