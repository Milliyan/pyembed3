// ─────────────────────────────────────────────
//  Target MCU Profiles
//  Each target defines how Python constructs map to hardware C APIs
// ─────────────────────────────────────────────

export const TARGETS = {
  arduino: {
    label:       "Arduino",
    sub:         "Uno / Nano / Mega",
    color:       "#00979D",
    badge:       "#E0F7F7",
    adcMax:      1023,
    adcBits:     10,
    serialBaud:  9600,
    voltage:     "5V",
    headers:     ["#include <Arduino.h>"],
    serialBegin: (baud)     => `Serial.begin(${baud});`,
    serialPrint: (a)        => `Serial.println(${a})`,
    analogWrite: (p, v)     => `analogWrite(${p}, ${v})`,
    analogRead:  (p)        => `analogRead(${p})`,
    delay:       (ms)       => `delay(${ms})`,
    delayMicro:  (us)       => `delayMicroseconds(${us})`,
    tone:        (p, f)     => `tone(${p}, ${f})`,
    noTone:      (p)        => `noTone(${p})`,
    pulseIn:     (p, v)     => `pulseIn(${p}, ${v})`,
    millis:      ()         => `millis()`,
    micros:      ()         => `micros()`,
    pwmSetup:    ()         => [],
    pwmWrite:    (p, v)     => `analogWrite(${p}, ${v})`,
    mapPin:      (p)        => p,
    notes: [
      "// ADC: 10-bit resolution (0–1023)",
      "// PWM: 8-bit via analogWrite() on pins 3,5,6,9,10,11",
      "// Logic: 5V — do NOT connect 3.3V-only sensors directly",
    ],
  },

  esp32: {
    label:       "ESP32",
    sub:         "DevKit / WROOM",
    color:       "#E7322A",
    badge:       "#FEE2E2",
    adcMax:      4095,
    adcBits:     12,
    serialBaud:  115200,
    voltage:     "3.3V",
    headers:     ["#include <Arduino.h>", "#include <driver/ledc.h>"],
    serialBegin: (baud)     => `Serial.begin(${baud});`,
    serialPrint: (a)        => `Serial.println(${a})`,
    analogWrite: (p, v)     => `ledcWrite(0, ${v})`,
    analogRead:  (p)        => `analogRead(${p})`,
    delay:       (ms)       => `delay(${ms})`,
    delayMicro:  (us)       => `delayMicroseconds(${us})`,
    tone:        (p, f)     => `ledcWriteTone(0, ${f})`,
    noTone:      (p)        => `ledcWriteTone(0, 0)`,
    pulseIn:     (p, v)     => `pulseIn(${p}, ${v})`,
    millis:      ()         => `millis()`,
    micros:      ()         => `micros()`,
    pwmSetup:    (pin)      => [
      `ledcSetup(0, 5000, 8);`,
      `ledcAttachPin(${pin}, 0);`,
    ],
    pwmWrite:    (p, v)     => `ledcWrite(0, ${v})`,
    mapPin:      (p)        => {
      const m = { A0: "GPIO36", A1: "GPIO39", LED_BUILTIN: "GPIO2" };
      return m[p] || p;
    },
    notes: [
      "// ADC: 12-bit resolution (0–4095)",
      "// PWM: ledcSetup/ledcAttachPin/ledcWrite required",
      "// Logic: 3.3V only — 5V on GPIO will damage the chip!",
    ],
  },

  stm32: {
    label:       "STM32",
    sub:         "F4 / F1 / L4",
    color:       "#0033A0",
    badge:       "#DBEAFE",
    adcMax:      4095,
    adcBits:     12,
    serialBaud:  115200,
    voltage:     "3.3V",
    headers:     [
      "#include \"stm32f4xx_hal.h\"",
      "#include <string.h>",
      "#include <stdio.h>",
    ],
    serialBegin: (baud)     => `// UART at ${baud} baud — configure via CubeMX`,
    serialPrint: (a)        => `HAL_UART_Transmit(&huart2, (uint8_t*)${a}, strlen(${a}), HAL_MAX_DELAY)`,
    analogWrite: (p, v)     => `__HAL_TIM_SET_COMPARE(&htim2, TIM_CHANNEL_1, ${v})`,
    analogRead:  (p)        => `HAL_ADC_GetValue(&hadc1)`,
    delay:       (ms)       => `HAL_Delay(${ms})`,
    delayMicro:  (us)       => `DWT_Delay_us(${us})`,
    tone:        (p, f)     => `/* tone ${f}Hz on pin ${p} — use TIM PWM */`,
    noTone:      (p)        => `__HAL_TIM_SET_COMPARE(&htim2, TIM_CHANNEL_1, 0)`,
    pulseIn:     (p, v)     => `/* pulseIn — use TIM input capture on pin ${p} */`,
    millis:      ()         => `HAL_GetTick()`,
    micros:      ()         => `(DWT->CYCCNT / (SystemCoreClock / 1000000))`,
    pwmSetup:    (pin)      => [
      "// TIM2 CH1 PWM — configure via CubeMX or manually:",
      "HAL_TIM_PWM_Start(&htim2, TIM_CHANNEL_1);",
    ],
    pwmWrite:    (p, v)     => `__HAL_TIM_SET_COMPARE(&htim2, TIM_CHANNEL_1, ${v})`,
    mapPin:      (p)        => {
      const m = { 13: "PA5", 9: "PA0", 6: "PA1", 2: "PA2", LED_BUILTIN: "PA5", A0: "PA0" };
      return m[p] || `PA${p}`;
    },
    notes: [
      "// ADC: 12-bit resolution (0–4095) via HAL_ADC",
      "// PWM: TIM2/TIM3 hardware timers required",
      "// GPIO: HAL_GPIO_WritePin / HAL_GPIO_ReadPin",
      "// UART: HAL_UART_Transmit for Serial output",
      "// Configure peripherals in STM32CubeMX before use",
    ],
  },
};
