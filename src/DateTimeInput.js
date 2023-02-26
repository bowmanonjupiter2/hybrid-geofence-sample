import React, { useState } from 'react'
import moment from 'moment'

export function DateTimeInput({ value, onChange }) {
  const [_currentValue, _setCurrentValue] = useState(null)
  const [_value, _setValue] = useState("")

  /*
   * We're handling the datetime-local translation internally, and only output valid datetime objects
   */
  if (_currentValue !== value) {
    _setCurrentValue(value)
    if (value != null && value != "") {
      _setValue(moment(value).local().format(moment.HTML5_FMT.DATETIME_LOCAL))
    }
  }

  return (
    <>
      <div>
        <label htmlFor="dt" className="block text-sm font-normal leading-5 text-gray-500">Pick Target Date/Time</label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <div className="relative flex-grow">
            <input type="datetime-local" value={_value}
              onChange={(e) => {
                _setValue(e.target.value)

                const currentValue = moment(e.target.value)
                if (currentValue.isValid() && onChange != null) {
                  //onChange(currentValue.utc().toISOString())
                  onChange(currentValue)
                  // console.log("currentValue", currentValue);
                }
              }}
              id="dt"
              className="form-input block w-full rounded-none rounded-l-md pl-3 transition ease-in-out duration-150 sm:text-sm sm:leading-5" placeholder="Departure Time" />
          </div>
          <button
            onClick={(e) => {
              e.preventDefault()
              const val = moment().local().format(moment.HTML5_FMT.DATETIME_LOCAL)
              _setValue(val)

              if (onChange != null) {
                //onChange(moment(val).utc().toISOString())
                onChange(moment())
              }
            }}
            className="-ml-px relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm leading-5 font-medium rounded-r-md text-gray-700 bg-gray-50 hover:text-gray-500 hover:bg-white focus:outline-none focus:shadow-outline-blue focus:border-blue-300 active:bg-gray-100 active:text-gray-700 transition ease-in-out duration-150">
            Now
          </button>
        </div>
      </div>
    </>
  )
}