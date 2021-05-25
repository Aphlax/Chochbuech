/**
 * Created by Fabian on 30.11.2016.
 */

"use strict";

angular.module('PhotoCapture', [])
    .directive('photoCapture', function() {
        return {
            restrict: 'E',
            replace: true,
            template: '<video autoplay></video>',
            scope: { width: '=?', height: '=?' },
            link: function(scope, element, attrs) {
                scope.width = attrs.width || 360;
                scope.height = attrs.height || 0;
                const canvas = angular.element('<canvas/>')[0];
                const video = element[0];

                const options = { audio: false, video: { facingMode: "environment" } };

                navigator.mediaDevices.enumerateDevices(options)
                    .then(devices => {
                        let dev = devices.find(d => d.kind == 'videoinput' &&
                            (d.label.indexOf('rear') != -1 || d.label.indexOf('back') != -1));
                        if (dev)
                            options.video = { deviceId: dev.deviceId };

                        navigator.mediaDevices.getUserMedia(options)
                            .then(stream => {
                                video.srcObject = stream;
                            }).catch(console.error);
                    }).catch(console.error);

                video.addEventListener('canplay', function(){
                    scope.height = video.videoHeight / (video.videoWidth/scope.width);

                    video.setAttribute('width', scope.width);
                    video.setAttribute('height', scope.height);
                    canvas.setAttribute('width', scope.width);
                    canvas.setAttribute('height', scope.height);
                }, false);

                scope.$on('capture', function() {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    canvas.getContext('2d').drawImage(video, 0, 0);
                    scope.photo = canvas.toDataURL('image/webp');

                    scope.$emit('photo',
                        { photo: scope.photo, width: video.videoWidth, height: video.videoHeight });
                })
            }
        }
    });