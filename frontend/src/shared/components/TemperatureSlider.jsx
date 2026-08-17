import './TemperatureSlider.css'

// Native <input type="range"> zaten klavye ile kontrol edilebilir (ok tuşları,
// Home/End, PageUp/PageDown) — tasarım dokümanı §3.5'in "sadece mouse-drag'e
// bağımlı olmayacak" şartı bu sayede ekstra kod olmadan karşılanır.
export default function TemperatureSlider ({
  id,
  label,
  value,
  onChange,
  min = 10,
  max = 30,
  step = 0.5,
}) {
  return (
    <div className="temperature-slider">
      <div className="temperature-slider__header">
        <label htmlFor={id}>{label}</label>
        <span className="temperature-slider__value data">{value}°C</span>
      </div>
      <input
        id={id}
        type="range"
        className="temperature-slider__input"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-valuetext={`${value}°C`}
      />
      <div className="temperature-slider__range">
        <span>{min}°C</span>
        <span>{max}°C</span>
      </div>
    </div>
  )
}
