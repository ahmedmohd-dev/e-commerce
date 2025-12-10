import React, { useState, useEffect } from "react";

export default function CountdownTimer({
  hours = 0,
  minutes = 0,
  seconds = 0,
}) {
  const [timeLeft, setTimeLeft] = useState({
    hours: hours,
    minutes: minutes,
    seconds: seconds,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;

        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        } else {
          // Timer ended
          return { hours: 0, minutes: 0, seconds: 0 };
        }

        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (value) => String(value).padStart(2, "0");

  return (
    <div className="countdown-timer">
      <div className="countdown-timer__label mb-3">
        <i className="fas fa-clock me-2"></i>
        Flash Sale Ends In:
      </div>
      <div className="countdown-timer__display d-flex gap-2">
        <div className="countdown-timer__unit">
          <div className="countdown-timer__value">
            {formatTime(timeLeft.hours)}
          </div>
          <div className="countdown-timer__label-small">Hours</div>
        </div>
        <div className="countdown-timer__separator">:</div>
        <div className="countdown-timer__unit">
          <div className="countdown-timer__value">
            {formatTime(timeLeft.minutes)}
          </div>
          <div className="countdown-timer__label-small">Minutes</div>
        </div>
        <div className="countdown-timer__separator">:</div>
        <div className="countdown-timer__unit">
          <div className="countdown-timer__value">
            {formatTime(timeLeft.seconds)}
          </div>
          <div className="countdown-timer__label-small">Seconds</div>
        </div>
      </div>
    </div>
  );
}





















