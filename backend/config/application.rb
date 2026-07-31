require_relative "boot"

require "rails"

# Core railties
require "active_model/railtie"
require "active_job/railtie"
require "active_record/railtie"
require "action_controller/railtie"
# require "action_mailer/railtie"
require "active_storage/engine"
require "action_view/railtie"
require "action_cable/engine"

Bundler.require(*Rails.groups)

module Backend
  class Application < Rails::Application
    config.load_defaults 8.0

    # Use Zeitwerk (modern, correct)
    config.autoloader = :zeitwerk

    # Autoload lib safely
    config.autoload_lib(ignore: %w[assets tasks])

    config.active_support.to_time_preserves_timezone = :zone
  end
end
