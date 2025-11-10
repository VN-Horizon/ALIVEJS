
async function loadEvents() {
    try {
        const EventMappings = (await protobuf.load('/assets/events/events.proto'))
                                    .lookupType('events.EventMappings');
        const response = await fetch('/assets/events/events.pb');
        const arrayBuffer = await response.arrayBuffer();
        const decodedEvents = EventMappings.decode(new Uint8Array(arrayBuffer));
        const eventsObject = EventMappings.toObject(decodedEvents, {});
        
        console.log('Events loaded successfully!', eventsObject);
        return eventsObject;
    } catch (error) {
        console.error('Error loading events:', error);
        throw error;
    }
}