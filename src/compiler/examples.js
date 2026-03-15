// ─────────────────────────────────────────────
//  Example Programs (grouped by category)
// ─────────────────────────────────────────────

export const EXAMPLE_GROUPS = {
  "Basic":     ["Blink LED", "Button Counter", "PWM Fade"],
  "Sensors":   ["Temperature Sensor", "Ultrasonic Distance", "PIR Motion"],
  "Actuators": ["Servo Motor", "Motor Control", "Buzzer Melody"],
  "Advanced":  ["Traffic Light FSM", "LCD Display", "EEPROM Read Write"],
};

export const EXAMPLES = {
  "Blink LED": `# Blink an LED on pin 13
def setup():
    pinMode(13, OUTPUT)

def loop():
    digitalWrite(13, HIGH)
    delay(1000)
    digitalWrite(13, LOW)
    delay(1000)`,

  "Button Counter": `# Count button presses
def setup():
    pinMode(2, INPUT_PULLUP)
    pinMode(13, OUTPUT)

def loop():
    count: int = 0
    pressed: bool = False
    while True:
        state: int = digitalRead(2)
        if state == 0 and not pressed:
            count += 1
            pressed = True
            print(count)
            digitalWrite(13, HIGH)
            delay(100)
            digitalWrite(13, LOW)
        elif state == 1:
            pressed = False
        delay(10)`,

  "PWM Fade": `# Fade LED in and out using PWM
def fade_in(pin: int, steps: int):
    step: int = 255 // steps
    brightness: int = 0
    for i in range(steps):
        analogWrite(pin, brightness)
        brightness += step
        delay(20)

def fade_out(pin: int, steps: int):
    step: int = 255 // steps
    brightness: int = 255
    for i in range(steps):
        analogWrite(pin, brightness)
        brightness -= step
        delay(20)

def setup():
    pinMode(9, OUTPUT)

def loop():
    fade_in(9, 50)
    fade_out(9, 50)`,

  "Temperature Sensor": `# Read analog temperature sensor (LM35)
def read_temp(pin: int) -> float:
    raw: int = analogRead(pin)
    voltage: float = raw * 0.0049
    temp: float = (voltage - 0.5) * 100.0
    return temp

def setup():
    pinMode(0, INPUT)

def loop():
    temp: float = read_temp(0)
    if temp > 30.0:
        print("WARNING: High temp!")
        digitalWrite(LED_BUILTIN, HIGH)
    else:
        digitalWrite(LED_BUILTIN, LOW)
    delay(500)`,

  "Ultrasonic Distance": `# HC-SR04 Ultrasonic Distance Sensor
def measure_cm(trig: int, echo: int) -> int:
    digitalWrite(trig, LOW)
    delayMicroseconds(2)
    digitalWrite(trig, HIGH)
    delayMicroseconds(10)
    digitalWrite(trig, LOW)
    duration: int = pulseIn(echo, HIGH)
    distance: int = duration * 0.034 // 2
    return distance

def setup():
    pinMode(9, OUTPUT)
    pinMode(10, INPUT)

def loop():
    dist: int = measure_cm(9, 10)
    print(dist)
    if dist < 10:
        digitalWrite(13, HIGH)
        tone(8, 1000)
    else:
        digitalWrite(13, LOW)
        noTone(8)
    delay(100)`,

  "PIR Motion": `# PIR Motion Detector
def on_motion(led: int, buzzer: int):
    digitalWrite(led, HIGH)
    tone(buzzer, 2000)
    delay(200)
    noTone(buzzer)
    print("Motion detected!")

def setup():
    pinMode(2, INPUT)
    pinMode(13, OUTPUT)
    pinMode(8, OUTPUT)

def loop():
    motion: int = digitalRead(2)
    if motion == 1:
        on_motion(13, 8)
    else:
        digitalWrite(13, LOW)
    delay(500)`,

  "Servo Motor": `# Servo motor sweep
def servo_write(pin: int, angle: int):
    pulse: int = 1000 + (angle * 1000 // 180)
    digitalWrite(pin, HIGH)
    delayMicroseconds(pulse)
    digitalWrite(pin, LOW)
    delay(20)

def sweep(pin: int, from_angle: int, to_angle: int):
    angle: int = from_angle
    while angle <= to_angle:
        servo_write(pin, angle)
        angle += 2
        delay(15)

def setup():
    pinMode(9, OUTPUT)

def loop():
    sweep(9, 0, 180)
    delay(500)
    sweep(9, 180, 0)
    delay(500)`,

  "Motor Control": `# DC motor bidirectional control
def clamp(val: int, lo: int, hi: int) -> int:
    if val < lo:
        return lo
    elif val > hi:
        return hi
    return val

def motor_forward(fwd: int, rev: int, pwm: int, speed: int):
    spd: int = clamp(speed, 0, 255)
    digitalWrite(fwd, HIGH)
    digitalWrite(rev, LOW)
    analogWrite(pwm, spd)

def motor_stop(fwd: int, rev: int, pwm: int):
    digitalWrite(fwd, LOW)
    digitalWrite(rev, LOW)
    analogWrite(pwm, 0)

def setup():
    pinMode(7, OUTPUT)
    pinMode(8, OUTPUT)
    pinMode(6, OUTPUT)

def loop():
    motor_forward(7, 8, 6, 200)
    delay(2000)
    motor_stop(7, 8, 6)
    delay(500)`,

  "Buzzer Melody": `# Play a simple melody
def play_note(pin: int, freq: int, dur: int):
    tone(pin, freq)
    delay(dur)
    noTone(pin)
    delay(50)

def play_scale(pin: int):
    play_note(pin, 262, 300)
    play_note(pin, 294, 300)
    play_note(pin, 330, 300)
    play_note(pin, 349, 300)
    play_note(pin, 392, 300)
    play_note(pin, 440, 300)
    play_note(pin, 523, 400)

def setup():
    pinMode(8, OUTPUT)

def loop():
    play_scale(8)
    delay(2000)`,

  "Traffic Light FSM": `# Traffic light finite state machine
def state_red(r: int, y: int, g: int):
    digitalWrite(r, HIGH)
    digitalWrite(y, LOW)
    digitalWrite(g, LOW)

def state_green(r: int, y: int, g: int):
    digitalWrite(r, LOW)
    digitalWrite(y, LOW)
    digitalWrite(g, HIGH)

def state_yellow(r: int, y: int, g: int):
    digitalWrite(r, LOW)
    digitalWrite(y, HIGH)
    digitalWrite(g, LOW)

def setup():
    pinMode(2, OUTPUT)
    pinMode(3, OUTPUT)
    pinMode(4, OUTPUT)

def loop():
    state_red(2, 3, 4)
    delay(5000)
    state_green(2, 3, 4)
    delay(4000)
    state_yellow(2, 3, 4)
    delay(1000)`,

  "LCD Display": `# I2C LCD display helpers
def lcd_init(addr: int):
    digitalWrite(addr, HIGH)
    delay(50)

def lcd_print_val(pin: int, val: int):
    analogWrite(pin, val)
    print(val)

def setup():
    pinMode(12, OUTPUT)
    lcd_init(12)

def loop():
    sensor_val: int = analogRead(0)
    mapped: int = sensor_val // 4
    lcd_print_val(12, mapped)
    if mapped > 200:
        print("HIGH")
    elif mapped > 100:
        print("MEDIUM")
    else:
        print("LOW")
    delay(1000)`,

  "EEPROM Read Write": `# EEPROM read and write operations
def eeprom_write(addr: int, val: int):
    analogWrite(addr, val)
    delay(5)

def eeprom_read(addr: int) -> int:
    val: int = analogRead(addr)
    return val

def save_config(base: int, bright: int, speed: int):
    eeprom_write(base, bright)
    eeprom_write(base + 1, speed)

def setup():
    save_config(0, 128, 50)
    brightness: int = eeprom_read(0)
    print(brightness)
    pinMode(9, OUTPUT)

def loop():
    brightness: int = eeprom_read(0)
    analogWrite(9, brightness)
    delay(1000)`,
};
