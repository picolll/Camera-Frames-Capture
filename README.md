# Camera Frames Capture by Piotr Lipski

This project is a simple React application that captures a sequence of frames from the user's camera and encodes them using the WebCodecs API. The application displays the captured frames and allows the user to select a frame and view it.

## Requirements

- A browser that supports WebCodecs API, such as Google Chrome or Microsoft Edge.
- A webcam or camera attached to the device.

## Steps to run

1. Clone the repository to a local directory.
2. Run `npm install` to install the dependencies.
3. Run `npm run dev` to start the development server.
4. Open a web browser and navigate to url presented in the terminal, for example: `http://localhost:5173`.
```
  VITE v7.1.3  ready in 409 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```
5. Grant the application access to the camera when prompted.
6. Click the **"Start"** button to start capturing frames.
    * Controls section is presented at the top of the page. 
    * You can set the pattern for background color when capturing the frames.
    * **0 - black, 1 - white**. You should enter as many digits as the number of frames you want to capture.
    * Validation will prevents you from starting if you have invalid values ( not 0 or 1) and more or less then Frames count.
    * By default pattern is set to **'00110011001100110011'** and Frames count is set to 20 as in assigment. I just added the option to change it for generating different results.
    * I also add an option to choose the codec for encoding and decoding. Defaults to **VP8**, but you can also choose **VP9**.
    * You can Reset the pattern and frames count to default values by clicking the **"Reset"** button and start capturing from the scrach.
    * You can use **'Hide/Show Camera'** button to hide/show the camera feed, when recording or let the application do it for you. By default the application will show the Camera while recording and then hide it to show the results.
    * You can use **'Toggle Background Color'** button to toggle the background color between black and white.(convinience feature)
    * You can view captured Frames by selecting them from the dropdown. Viewing them int the order of capturing has the desired effect as they are stored as deltas from the previous frame. Viewing them in random order will generate noisy results.
    * You can use **'Start Animate'** button to start the animation of the frames in loop. You can use **'Stop Animate'** button to stop the animation.
    * Frames are displayed in their captured resolution and not scaled down, so depending on your camera resolution, you can zoom out to view them.