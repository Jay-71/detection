(async function() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const labelBox = document.getElementById('label-box');
    const ctx = canvas.getContext('2d');

    // Map specific objects to corresponding numbers
    const objectMapping = {
        person: 1,
        car: 2,
        bicycle: 3,
        bus: 4,
        traffic_light: 5,
        stop_sign: 6
    };

    // Initialize the camera with constraints
    const startCamera = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: 'environment',  // Use the back camera
                width: { ideal: 640 },      // Adjust resolution
                height: { ideal: 480 }
            }
        });
        video.srcObject = stream;
        await new Promise(resolve => (video.onloadedmetadata = resolve));
        video.play();
    };

    // Run detection loop
    const detectObjects = async model => {
        canvas.width = video.videoWidth; // Use video width for canvas
        canvas.height = video.videoHeight; // Use video height for canvas

        // Scale factors to adjust bounding box position/size
        const scaleX = canvas.width / video.videoWidth;
        const scaleY = canvas.height / video.videoHeight;

        const videoCenterX = canvas.width / 2; // Center of the video frame

        while (true) {
            const predictions = await model.detect(video);

            // Draw the current video frame
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous frame
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height); // Draw live video

            // Draw bounding boxes and labels
            const detectedNumbers = predictions.map(pred => {
                const [x, y, width, height] = pred.bbox;

                // Scale bounding box coordinates
                const scaledX = x * scaleX;
                const scaledY = y * scaleY;
                const scaledWidth = width * scaleX;
                const scaledHeight = height * scaleY;

                // Calculate the center of the bounding box
                const centerX = scaledX + scaledWidth / 2;

                // Determine the direction (left, center, or right)
                let direction = 'Center'; // Default direction is center
                if (centerX < videoCenterX - 100) { // 100px threshold for "left"
                    direction = 'Left';
                } else if (centerX > videoCenterX + 100) { // 100px threshold for "right"
                    direction = 'Right';
                }

                ctx.strokeStyle = 'red';
                ctx.lineWidth = 2;
                ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight); // Bounding box
                ctx.fillStyle = 'red';
                ctx.font = '16px Arial';
                ctx.fillText(`${pred.class} (${Math.round(pred.score * 100)}%) - ${direction}`, scaledX, scaledY - 5); // Label with direction

                // Return the corresponding number if the object is mapped
                return objectMapping[pred.class] || null;
            }).filter(number => number !== null); // Remove unmapped objects

            // Update the label box
            labelBox.textContent = detectedNumbers.length ? `Detected: ${detectedNumbers.join(', ')}` : 'No relevant objects detected';

            // Send detected numbers to MIT App Inventor
            if (window.AppInventor) {
                window.AppInventor.setWebViewString(detectedNumbers.join(', '));
            }

            await tf.nextFrame(); // Wait for the next animation frame
        }
    };

    // Load the model and start detection
    await startCamera();
    const model = await cocoSsd.load();
    detectObjects(model);
})();
