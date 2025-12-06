"use client";
import { useEffect, useRef, useState } from "react";
import Icon from "@mdi/react";
import { mdiRefresh } from "@mdi/js";
// import ShutterSound from "../../public/shutter-sound.m4a";
export default function Home() {
  const video = useRef(null);
  const [timer, setTimer] = useState(3);
  const [runTimer, setRunTimer] = useState(false);
  const [attemptTake, setAttemptTake] = useState(0);
  const [maxAttempt, setMaxAttempt] = useState(3);
  const [resetIndex, setResetIndex] = useState<number | null>(null);
  const [photos, setPhotos] = useState([]);
  const [blink, setBlink] = useState(false);
  const truthyNumber = (value) => {
    if (value || value === 0) {
      return true;
    } else {
      return false;
    }
  };
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        video.current.srcObject = stream;
        video.current.play();
      })
      .catch((err) => {
        console.error(`An error occurred: ${err}`);
      });
  }, []);

  const dpi = 72 / 2.54;

  const savePicture = () => {
    const canvas = document.createElement("canvas");
    canvas.height = video.current.videoHeight;
    canvas.width = video.current.videoWidth;
    const context = canvas.getContext("2d");
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video.current, 0, 0, canvas.width, canvas.height);
    console.log(resetIndex);
    if (truthyNumber(resetIndex)) {
      const currentPhotos = [...photos];
      currentPhotos[resetIndex] = canvas;
      setPhotos(currentPhotos);
      setResetIndex(null);
    } else {
      setPhotos([...photos, canvas]);
    }
  };

  // const takePicture = () => {
  //   const canvas = document.createElement("canvas");
  //   canvas.height = video.current.videoHeight;
  //   canvas.width = video.current.videoWidth;
  //   const context = canvas.getContext("2d");
  //   context.translate(canvas.width, 0);
  //   context.scale(-1, 1);
  //   context.drawImage(video.current, 0, 0, canvas.width, canvas.height);
  //   const img = new Image();
  //   img.src = canvas.toDataURL();
  //   canvas.toBlob(function (blob) {
  //     const url = URL.createObjectURL(blob);
  //     const a = document.createElement("a");
  //     a.href = url;
  //     a.download = "canvas_image.png";
  //     a.click();
  //     URL.revokeObjectURL(url);
  //   }, "image/png");
  // };
  // const clearPhoto = () => {
  //   const context = canvas.getContext("2d");
  //   context.fillStyle = "#aaaaaa";
  //   context.fillRect(0, 0, canvas.width, canvas.height);

  //   const data = canvas.toDataURL("image/png");
  //   photo.setAttribute("src", data);
  // };

  const countdownReset = () => {
    setAttemptTake(0);
    setTimer(3);
    setMaxAttempt(1);
    setRunTimer((prevRun) => (prevRun = !prevRun));
  };
  const resetPhoto = (idx: number) => {
    setResetIndex(idx);
    const currentPhotos = [...photos];
    currentPhotos[idx] = null;
    setPhotos(currentPhotos);
  };
  const playShutter = () => {
    const audio = new Audio("/shutter-sound.m4a");
    audio.play();
  };
  const drawImageCover = (ctx, img, canvasWidth, canvasHeight, dx, dy) => {
    const imageWidth = img.width;
    const imageHeight = img.height;

    const canvasAspectRatio = canvasWidth / canvasHeight;
    const imageAspectRatio = imageWidth / imageHeight;

    let sx, sy, sWidth, sHeight;

    if (imageAspectRatio > canvasAspectRatio) {
      sHeight = imageHeight;
      sWidth = imageHeight * canvasAspectRatio;
      sx = (imageWidth - sWidth) / 2;
      sy = 0;
    } else {
      sWidth = imageWidth;
      sHeight = imageWidth / canvasAspectRatio;
      sx = 0;
      sy = (imageHeight - sHeight) / 2;
    }

    ctx.drawImage(
      img,
      sx,
      sy,
      sWidth,
      sHeight,
      dx,
      dy,
      canvasWidth,
      canvasHeight
    );
  };
  const createStrip = () => {
    const mergedCanvas = document.createElement("canvas");
    mergedCanvas.height = 1772;

    mergedCanvas.width = 591;
    const mergedCtx = mergedCanvas.getContext("2d");
    mergedCtx.fillStyle = "white"; // Or ctx.fillStyle = "#FFFFFF";
    mergedCtx.fillRect(0, 0, mergedCanvas.width, mergedCanvas.height);
    const padding = 59.5;
    let currentX = padding;
    let currentY = padding;

    const sizeImage = {
      width: 472,
      height: 472,
    };
    photos.forEach((item) => {
      drawImageCover(
        mergedCtx,
        item,
        sizeImage.width,
        sizeImage.height,
        currentX,
        currentY
      );
      // mergedCtx.drawImage(
      //   item,
      //   currentX,
      //   currentY,
      //   sizeImage.width,
      //   sizeImage.height
      // );
      currentY += sizeImage.height + padding;
    });
    const img = new Image();
    img.src = mergedCanvas.toDataURL();
    const timestampMs = Date.now();

    mergedCanvas.toBlob(function (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `canvas-${timestampMs}`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };
  useEffect(() => {
    let intervalId;
    if (runTimer && timer > 0 && attemptTake < maxAttempt) {
      intervalId = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
    } else if (timer == 0 && attemptTake < maxAttempt) {
      setBlink(true);
      savePicture();
      playShutter();
      setAttemptTake((prevAtt) => prevAtt + 1);
      setTimer(3);
      setTimeout(() => {
        setBlink(false);
      }, 150);
    }

    if (attemptTake == maxAttempt) {
      // createStrip();
      setAttemptTake(0);
      setRunTimer(false);
      // setPhotos([]);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [runTimer, timer]);

  const countdown = () => {
    if (truthyNumber(resetIndex)) {
      countdownReset();
    } else {
      setRunTimer((prevRun) => (prevRun = !prevRun));
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans">
      <main className="flex min-h-screen w-full max-w-6xl items-center justify-between py-32 px-16 sm:items-start">
        <div className=" items-center flex flex-col">
          <div className="relative">
            <div className="p-3 rounded-xl bg-white border border-gray-system">
              <video ref={video} className="-scale-x-100 relative rounded-lg">
                Video stream not available.
              </video>
            </div>

            {blink ? (
              <div className="absolute top-0 left-0 bg-white h-full w-full opacity-30 "></div>
            ) : (
              ""
            )}
            {runTimer && (
              <h2 className="absolute top-[50%] left-[50%] -translate-x-1/2 text-6xl font-bold opacity-50 text-white">
                {timer}
              </h2>
            )}
          </div>
          {photos.length == 3 && resetIndex === null ? (
            <button
              onClick={createStrip}
              className="rounded-lg bg-secondary p-2 w-1/2 mt-3 cursor-pointer text-primary"
            >
              Save progress
            </button>
          ) : (
            <button
              onClick={countdown}
              className="rounded-lg bg-primary p-2 w-1/2 mt-3 cursor-pointer text-white"
            >
              Take photo
            </button>
          )}
        </div>
        <div className="flex bg-white p-4 pb-16 flex-col rounded-lg border-gray-system space-y-4 drop-shadow-sm">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index}>
              {photos[index] ? (
                <div
                  onClick={() => resetPhoto(index)}
                  className="relative reset-container cursor-pointer"
                >
                  <img
                    src={photos[index].toDataURL("image/png")}
                    alt=""
                    className="size-40 object-cover"
                  />
                  <div className="absolute bg-black/30 size-40 top-0 reset-element justify-center items-center">
                    <Icon path={mdiRefresh} size={1}></Icon>
                  </div>
                </div>
              ) : (
                <div className="size-40 bg-gray-200"></div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
