(async function () {
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
        stop_sign: 6,
        motorcycle: 7,
        truck: 8
    };

    // Initialize the camera with constraints
    const startCamera = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment', // Use the back camera
                width: { ideal: 640 }, // Adjust resolution
                height: { ideal: 480 }
            }
        });
        video.srcObject = stream;
        await new Promise((resolve) => (video.onloadedmetadata = resolve));
        video.play();
    };

    // Function to determine the direction based on x-coordinate
    const getDirectionCode = (x, width) => {
        const centerX = width / 2;
        const leftThreshold = centerX / 2;
        const rightThreshold = centerX + centerX / 2;

        if (x < leftThreshold) {
            return 1; // Left
        } else if (x > rightThreshold) {
            return 3; // Right
        } else {
            return 2; // Center
        }
    };

    // Run detection loop
    const detectObjects = async (model) => {
        canvas.width = video.videoWidth; // Use video width for canvas
        canvas.height = video.videoHeight; // Use video height for canvas

        // Scale factors to adjust bounding box position/size
        const scaleX = canvas.width / video.videoWidth;
        const scaleY = canvas.height / video.videoHeight;

        while (true) {
            const predictions = await model.detect(video);

            // Draw the current video frame
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous frame
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height); // Draw live video

            // Draw bounding boxes and labels
            const detectedMessages = predictions.map((pred) => {
                const [x, y, width, height] = pred.bbox;

                // Scale bounding box coordinates
                const scaledX = x * scaleX;
                const scaledY = y * scaleY;
                const scaledWidth = width * scaleX;
                const scaledHeight = height * scaleY;

                // Determine the direction code
                const directionCode = getDirectionCode(scaledX + scaledWidth / 2, canvas.width);

                ctx.strokeStyle = 'red';
                ctx.lineWidth = 2;
                ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight); // Bounding box
                ctx.fillStyle = 'red';
                ctx.font = '16px Arial';
                ctx.fillText(`${pred.class} (${Math.round(pred.score * 100)}%)`, scaledX, scaledY - 5); // Label

                // Get the object number
                const objectNumber = objectMapping[pred.class] || null;

                if (objectNumber !== null) {
                    const message = `${objectNumber}${directionCode}`; // Combine object number and direction code
                    
                    // Send message to MIT App Inventor
                    if (window.AppInventor) {
                        window.AppInventor.setWebViewString(message); // Send combined message
                    }

                    return message;
                }

                return null;
            }).filter((message) => message !== null); // Remove null messages

            // Update the label box
            labelBox.textContent = detectedMessages.length ? `Detected: ${detectedMessages.join(', ')}` : 'No relevant objects detected';

            await tf.nextFrame(); // Wait for the next animation frame
        }
    };

    // Load the model and start detection
    await startCamera();
    const model = await cocoSsd.load();
    detectObjects(model);
})();
