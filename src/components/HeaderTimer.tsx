export function HeaderTimer({time}:{time:number}){return <div className={time<10?'timer pulse':'timer'}>⏱️ {time}s</div>}
