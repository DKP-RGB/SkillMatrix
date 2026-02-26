// src/utils/useProctor.js
import { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';

export const useProctor = (onCheatingDetected) => {
    const [model, setModel] = useState(null);
    const [isModelLoading, setIsModelLoading] = useState(true);
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const intervalRef = useRef(null);

    // Initialize AI Model
    useEffect(() => {
        const loadModel = async () => {
            try {
                await tf.ready();
                const loadedModel = await cocossd.load();
                setModel(loadedModel);
                setIsModelLoading(false);
                console.log("AI Proctoring Model Loaded");
            } catch (err) {
                console.error("Failed to load AI model:", err);
            }
        };
        loadModel();

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 320, height: 240 }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera access denied:", err);
        }
    };

    const runDetection = async () => {
        if (!model || !videoRef.current) return;

        const predictions = await model.detect(videoRef.current);

        let personCount = 0;
        let mobileDetected = false;

        predictions.forEach(prediction => {
            if (prediction.class === 'person') personCount++;
            if (prediction.class === 'cell phone' || prediction.class === 'mobile phone') {
                if (prediction.score > 0.6) mobileDetected = true;
            }
        });

        if (mobileDetected) {
            onCheatingDetected({
                type: 'HARD_VIOLATION',
                reason: 'Mobile Phone Detected'
            });
            return; // Stop further checks if hard violation
        }

        if (personCount === 0) {
            onCheatingDetected({
                type: 'SOFT_VIOLATION',
                reason: 'No Face Detected'
            });
        } else if (personCount > 1) {
            onCheatingDetected({
                type: 'SOFT_VIOLATION',
                reason: 'Multiple People Detected'
            });
        }
    };

    const startDetection = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(runDetection, 3000); // Check every 3 seconds
    };

    const stopDetection = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    return {
        videoRef,
        isModelLoading,
        startRecording,
        startDetection,
        stopDetection
    };
};
