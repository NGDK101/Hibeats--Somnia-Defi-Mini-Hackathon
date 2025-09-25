import { GeneratedMusic } from "@/types/music";

interface DynamicBackgroundProps {
    currentSong?: GeneratedMusic;
    isPlaying: boolean;
}

export const DynamicBackground = ({ currentSong, isPlaying }: DynamicBackgroundProps) => {
    return (
        <>
            {/* Default Dark Background */}
            <div 
                className="fixed inset-0 bg-black"
                style={{ zIndex: -100 }}
            />

            {/* Song Background Image */}
            {currentSong?.imageUrl && (
                <div 
                    className="fixed inset-0 transition-all duration-1000 ease-in-out"
                    style={{
                        backgroundImage: `url(${currentSong.imageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        filter: isPlaying 
                            ? 'blur(1px) brightness(0.7) saturate(1.1)' 
                            : 'blur(0.5px) brightness(0.6) saturate(1.05)',
                        transform: isPlaying ? 'scale(1.05)' : 'scale(1.02)',
                        zIndex: -90,
                        opacity: 0.92
                    }}
                />
            )}

            {/* Dark Overlay for readability */}
            <div 
                className="fixed inset-0 bg-black/10"
                style={{ zIndex: -80 }}
            />
        </>
    );
};
