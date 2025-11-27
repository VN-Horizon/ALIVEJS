
const $debugContainer = $('<div class="debug-container"></div>');
$('body').append($debugContainer);

let c = 0;

export function createPaneContainer() {
    const $paneContainer = $('<div class="pane-container"></div>');
    $paneContainer.css({
        transform: 'scale(1)',
        transition: `transform 0.2s cubic-bezier(0, 0.87, 0.13, 1) ${c * 0.05}s`,
        transformOrigin: 'top left',
    });
    c++;
    $debugContainer.append($paneContainer);
    return $paneContainer.get(0);
}

let isShowing = true;

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

$(document).on('keydown', (e) => {
    if (e.key === 'p') {
        isShowing = !isShowing;
        const $containers = $(".debug-container .pane-container");
        if(isShowing){
            $containers.each((index, element) => {
                $(element).css('transform', 'scale(1)');
            });
        } else {
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;
            
            $containers.each((index, element) => {
                const $el = $(element);
                $el.css('transform', `scale(0)`);
            });
        }
    }
});
