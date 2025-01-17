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

    // Resize video and canvas for better performance
    const resizeCanvas = () => {
        // Match the canvas size to the video element
        canvas.width = 640;  // Set to a lower resolution for performance
        canvas.height = 480;
    };

    // Run detection loop
    const detectObjects = async model => {
        resizeCanvas();  // Set canvas size to reduced resolution

        while (true) {
            const predictions = await model.detect(video);

            // Clear previous frame
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw the video frame on the canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Correcting bounding boxes by scaling them to match the reduced resolution
            const detected = predictions.map(pred => {
                const [x, y, width, height] = pred.bbox;

                // Scale the bounding box based on the video resolution
                const scaleX = canvas.width / video.videoWidth;
                const scaleY = canvas.height / video.videoHeight;

                const scaledX = x * scaleX;
                const scaledY = y * scaleY;
                const scaledWidth = width * scaleX;
                const scaledHeight = height * scaleY;

                // Draw bounding box
                ctx.strokeStyle = 'red';
                ctx.lineWidth = 2;
                ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);

                // Draw the label
                ctx.fillStyle = 'red';
                ctx.font = '16px Arial';
                ctx.fillText(`${pred.class} (${Math.round(pred.score * 100)}%)`, scaledX, scaledY - 5);

                return pred.class;
            });

            // Update the label box with detected objects
            labelBox.textContent = detected.length ? `Detected: ${detected.join(', ')}` : 'No objects detected';
  if (window.AppInventor) {
                window.AppInventor.setWebViewString(detected.join(', '));
            }
            await tf.nextFrame(); // Wait for the next animation frame
        }
    };

    // Load the model and start detection
    await startCamera();
    const model = await cocoSsd.load();
    detectObjects(model);
})();
