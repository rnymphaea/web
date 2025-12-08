export let soundManager = {
    clips: {},
    context: null,
    gainNode: null,
    loaded: false,
    mute: false,

    init: function() {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.gainNode = this.context.createGain ? this.context.createGain() : this.context.createGainNode();
        this.gainNode.connect(this.context.destination);
        this.gainNode.gain.value = 1;
        console.log('Менеджер звука инициализирован');
    },

    load: function(path, callback) {
        if (this.clips[path]) {
            if (this.clips[path].loaded) {
                callback(this.clips[path]);
            } else {
                setTimeout(() => {
                    if (this.clips[path].loaded) {
                        callback(this.clips[path]);
                    }
                }, 100);
            }
            return;
        }

        let clip = {
            path: path,
            buffer: null,
            loaded: false
        };

        this.clips[path] = clip;

        let request = new XMLHttpRequest();
        request.open('GET', path, true);
        request.responseType = 'arraybuffer';

        request.onload = () => {
            this.context.decodeAudioData(request.response, (buffer) => {
                clip.buffer = buffer;
                clip.loaded = true;
                console.log('Звук загружен:', path);
                callback(clip);
            }, (error) => {
                console.error('Ошибка декодирования аудио:', error);
                clip.loaded = true;
                callback(clip);
            });
        };

        request.onerror = (error) => {
            console.error('Ошибка загрузки аудио:', error);
            clip.loaded = true;
            callback(clip);
        };

        request.send();
    },

    loadArray: function(array) {
        let loadedCount = 0;
        array.forEach((path) => {
            this.load(path, () => {
                loadedCount++;
                if (loadedCount === array.length) {
                    console.log('Все звуки загружены');
                }
            });
        });
    },

    play: function(path, settings = {}) {
        if (this.mute) return false;

        let looping = settings.looping || false;
        let volume = settings.volume !== undefined ? settings.volume : 1;

        let sd = this.clips[path];
        if (!sd) {
            console.warn('Звук не найден:', path);
            return false;
        }

        if (!sd.loaded) {
            console.warn('Звук не загружен:', path);
            return false;
        }

        if (!sd.buffer) {
            console.warn('Звуковой буфер пустой:', path);
            return false;
        }

        try {
            let sound = this.context.createBufferSource();
            sound.buffer = sd.buffer;
            
            let soundGain = this.context.createGain();
            soundGain.gain.value = volume;
            
            sound.connect(soundGain);
            soundGain.connect(this.gainNode);
            sound.loop = looping;
            
            sound.start(0);
            
            sound.onended = () => {
                sound.disconnect();
                soundGain.disconnect();
            };
            
            return true;
        } catch (error) {
            console.error('Ошибка воспроизведения звука:', error);
            return false;
        }
    },

    toggleMute: function() {
        this.mute = !this.mute;
        this.gainNode.gain.value = this.mute ? 0 : 1;
        console.log('Звук', this.mute ? 'отключен' : 'включен');
        return this.mute;
    },

    setMasterVolume: function(volume) {
        this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    },

    stopAll: function() {
        this.gainNode.disconnect();
        this.gainNode = this.context.createGain();
        this.gainNode.connect(this.context.destination);
        this.gainNode.gain.value = this.mute ? 0 : 1;
    }
};
