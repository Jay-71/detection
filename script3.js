(async function() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const labelBox = document.getElementById('label-box');
    const ctx = canvas.getContext('2d');

    // Initialize the camera with constraints
    const startCamera = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: 'environment',  // Use the back camera
                width: { ideal: 640 },      // Reduce resolution (adjust as needed)
                height: { ideal: 480 }
            }
        });
        video.srcObject = stream;
        await new Promise(resolve => (video.onloadedmetadata = resolve));
        video.play();
    };

    // Run detection loop
    const detectObjects = async model => {
        canvas.width = 640;  // Set canvas size to match reduced resolution
        canvas.height = 480;

        while (true) {
            const predictions = await model.detect(video);

            // Draw the current video frame
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous frame
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height); // Draw live video

            // Draw bounding boxes and labels
            const detected = predictions.map(pred => {
                const [x, y, width, height] = pred.bbox;
                ctx.strokeStyle = 'red';
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, width, height); // Bounding box
                ctx.fillStyle = 'red';
                ctx.font = '16px Arial';
                ctx.fillText(`${pred.class} (${Math.round(pred.score * 100)}%)`, x, y - 5); // Label
                return pred.class;
            });

            // Update the label box
            labelBox.textContent = detected.length ? `Detected: ${detected.join(', ')}` : 'No objects detected';

            await tf.nextFrame(); // Wait for the next animation frame
        }
    };

    // Load the model and start detection
    await startCamera();
    const model = await cocoSsd.load();
    detectObjects(model);
})();
