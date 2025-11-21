
const $debugContainer = $('<div class="debug-container"></div>');
$('body').append($debugContainer);

let c = 0;

export function createPaneContainer() {
    const $paneContainer = $('<div class="pane-container"></div>');
    $paneContainer.css({
        transform: 'translate(0px, 0px)',
        transition: `transform 0.3s cubic-bezier(0, 0.87, 0.58, 1) ${c * 0.01}s`,
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
                $(element).css('transform', 'translate(0px, 0px)');
            });
        } else {
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;
            
            $containers.each((index, element) => {
                const $el = $(element);
                const rect = element.getBoundingClientRect();
                const elementWidth = rect.width;
                const elementHeight = rect.height;
                
                const border = randomInt(0, 3);
                let x, y;
                
                if (border === 0) { // Left border
                    x = -rect.left - elementWidth - 20;
                    y = randomInt(-rect.top, screenHeight - rect.top - elementHeight);
                } else if (border === 1) { // Right border
                    x = screenWidth - rect.left + 20;
                    y = randomInt(-rect.top, screenHeight - rect.top - elementHeight);
                } else if (border === 2) { // Top border
                    x = randomInt(-rect.left, screenWidth - rect.left - elementWidth);
                    y = -rect.top - elementHeight - 20;
                } else { // Bottom border
                    x = randomInt(-rect.left, screenWidth - rect.left - elementWidth);
                    y = screenHeight - rect.top + 80;
                }
                
                $el.css('transform', `translate(${x}px, ${y}px)`);
            });
        }
    }
});
