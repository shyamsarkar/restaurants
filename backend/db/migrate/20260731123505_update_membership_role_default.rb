class UpdateMembershipRoleDefault < ActiveRecord::Migration[8.0]
  def change
    change_column_default :memberships, :role, from: 3, to: 4
  end
end
