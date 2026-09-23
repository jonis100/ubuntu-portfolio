/**
 * Host for the PurpleAir embed — Yoni's own sensor, #308702.
 *
 * PurpleAir's widget is a third-party script that does not play by React's
 * rules, so this module isolates the two things that make it awkward:
 *
 * 1. **It finds its container by `getElementById`, on a 120-second global
 *    timer.** If React created and destroyed the container along with the
 *    window, closing and reopening the app would leave a blank panel until
 *    the next poll came around. So the container is created exactly once and
 *    parked in a hidden holder on `document.body`; the app borrows it while
 *    its window is open and gives it back on close. The node is never
 *    destroyed, so the widget never loses its target and a reopened window
 *    shows the last reading immediately.
 *
 * 2. **It is ~570KB and bundles its own jQuery.** It is injected on first
 *    open and never again, so a visitor who never opens the app never pays
 *    for it.
 *
 * Note that the script also overwrites `document.body.className` whenever tab
 * visibility changes. Nothing puts classes on `<body>` today; nothing should
 * start.
 */

/** The sensor this portfolio shows. Also the map link in the app. */
export const SENSOR_ID = 308702;

/**
 * PurpleAir derives the widget's settings from the script's own `src`, and the
 * container id has to agree with the `container=` parameter in it — the id is
 * effectively part of the configuration, not a name we are free to choose.
 */
const WIDGET_PARAMS = 'module=US_EPA_AQI&conversion=C0&average=10&layer=US_EPA_AQI';
const CONTAINER_ID = `PurpleAirWidget_${SENSOR_ID}_module_US_EPA_AQI_conversion_C0_average_10_layer_US_EPA_AQI`;
const SCRIPT_SRC =
  `https://www.purpleair.com/pa.widget.js?${WIDGET_PARAMS}&container=${CONTAINER_ID}`;

/** Where the container lives while no window is showing it. */
let holder: HTMLElement | null = null;
let container: HTMLElement | null = null;
let loader: Promise<void> | null = null;

function ensureContainer(): HTMLElement {
  if (container) return container;

  holder = document.createElement('div');
  holder.style.display = 'none';
  document.body.appendChild(holder);

  container = document.createElement('div');
  container.id = CONTAINER_ID;
  holder.appendChild(container);

  return container;
}

/**
 * Injects the widget script, once per page load. Resolves when PurpleAir has
 * loaded and rejects if it could not be reached — an ad blocker, an offline
 * visitor, or a network that blocks the CDN. Callers show their own message;
 * the failure is expected often enough that it is part of the design.
 */
function loadScript(): Promise<void> {
  if (loader) return loader;

  loader = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () =>
      reject(new Error('PurpleAir widget script could not be loaded')),
    );
    document.body.appendChild(script);
  });

  return loader;
}

/**
 * Moves the widget into `parent` and makes sure the script is loading.
 * Returns a function that parks the widget back in the holder — call it from
 * the effect's cleanup.
 */
export function mountWidget(parent: HTMLElement): () => void {
  const node = ensureContainer();
  parent.appendChild(node);

  return () => {
    // The holder always exists by now: ensureContainer() creates both together.
    holder?.appendChild(node);
  };
}

export { loadScript as loadWidgetScript };

/** The sensor's page on the PurpleAir map. */
export const SENSOR_URL = `https://map.purpleair.com/1/i/mAQI/a10/cC0?select=${SENSOR_ID}`;
