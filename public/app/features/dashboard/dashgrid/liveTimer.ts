import { dateMath, dateTime, TimeRange } from '@grafana/data';
import { PanelChrome } from './PanelChrome';

// target is 20hz (50ms), but we poll at 100ms to smooth out jitter
const interval = 100;

interface LiveListener {
  last: number;
  intervalMs: number;
  panel: PanelChrome;
}

class LiveTimer {
  listeners: LiveListener[] = [];

  budget = 1;
  threshold = 1.5; // trial and error appears about right
  ok = true;
  lastUpdate = Date.now();

  isLive = false; // the dashboard time range ends in "now"
  timeRange?: TimeRange;

  /** Called when the dashboard time range changes */
  setLiveTimeRange(v?: TimeRange) {
    this.timeRange = v;
    this.isLive = v?.raw?.to === 'now';

    if (this.isLive) {
      for (const listener of this.listeners) {
        listener.intervalMs = getLiveTimerInterval(v!, listener.panel.props.width);
      }
    }
  }

  listen(panel: PanelChrome) {
    this.listeners.push({
      last: this.lastUpdate,
      panel: panel,
      intervalMs: getLiveTimerInterval(
        this.timeRange ?? ({ from: dateTime(0), to: dateTime(1000), raw: { from: '', to: '' } } as TimeRange),
        panel.props.width
      ),
    });
  }

  remove(panel: PanelChrome) {
    this.listeners = this.listeners.filter((v) => v.panel !== panel);
  }

  updateInterval(panel: PanelChrome) {
    if (!this.timeRange || !this.isLive) {
      return;
    }
    for (const listener of this.listeners) {
      if (listener.panel === panel) {
        listener.intervalMs = getLiveTimerInterval(this.timeRange!, listener.panel.props.width);
      }
    }
  }

  // Called at the consistent dashboard interval
  measure = () => {
    const now = Date.now();
    this.budget = (now - this.lastUpdate) / interval;
    this.ok = this.budget <= this.threshold;
    this.lastUpdate = now;

    // For live dashboards, listen to changes
    if (this.ok && this.isLive && this.timeRange) {
      // console.log(
      //   'Live CHECK',
      //   this.listeners.map((v) => v.intervalMs)
      // );

      // when the time-range is relative fire events
      let tr: TimeRange | undefined = undefined;
      for (const listener of this.listeners) {
        if (!listener.panel.props.isInView) {
          continue;
        }

        const elapsed = now - listener.last;
        if (elapsed >= listener.intervalMs) {
          if (!tr) {
            const { raw } = this.timeRange;
            tr = {
              raw,
              from: dateMath.parse(raw.from, false)!,
              to: dateMath.parse(raw.to, true)!,
            };
          }
          listener.panel.liveTimeChanged(tr);
          listener.last = now;
        }
      }
    }
  };
}

const FIVE_MINS = 5 * 60 * 1000;

export function getLiveTimerInterval(tr: TimeRange, width: number): number {
  const delta = tr.to.valueOf() - tr.from.valueOf();
  const millisPerPixel = Math.ceil(delta / width / 100) * 100;
  if (millisPerPixel > FIVE_MINS) {
    return FIVE_MINS;
  }
  return millisPerPixel;
}

export const liveTimer = new LiveTimer();
setInterval(liveTimer.measure, interval);
