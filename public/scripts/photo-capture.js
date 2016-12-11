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
            link: function(scope, element, attrs, controller) {
                scope.photo = null;
                scope.width = attrs.width || 360;
                scope.height = attrs.height || 0;
                let canvas = angular.element('<canvas/>')[0];
                let video = element[0];

                let options = { audio: false, video: { facingMode: "environment" } };

                navigator.mediaDevices.enumerateDevices()
                    .then(function(devices) {
                        let dev = devices.find(d => d.kind == 'videoinput' &&
                            (d.label.indexOf('rear') != -1 || d.label.indexOf('back') != -1));
                        let options = { audio: false, video: { facingMode: "environment" } };
                        if (dev)
                            options.video = { deviceId: dev.deviceId };

                        navigator.mediaDevices.getUserMedia(options)
                            .then(function(stream) {
                                video.src = window.URL.createObjectURL(stream);
                                video.play();
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
                    let context = canvas.getContext('2d');
                    context.drawImage(video, 0, 0, scope.width, scope.height);
                    scope.photo = canvas.toDataURL('image/png');

                    scope.$root.$broadcast('photo', { photo: scope.photo, width: scope.width, height: scope.height });
                })
            }
        }
    });