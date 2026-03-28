use spacetimedb::{reducer, table, ReducerContext, Table, Timestamp};

#[table(accessor = npc_object, public)]
pub struct NpcObject {
    #[primary_key]
    pub id: String,
    pub name: String,
    pub personality: String,
    pub backstory: String,
    pub voice_description: String,
    pub image_url: String,
    pub original_image_url: String,
    pub voice_id: String,
    pub times_talked_to: u32,
    pub created_at: Timestamp,
}

#[reducer(init)]
pub fn init(_ctx: &ReducerContext) {}

#[reducer(client_connected)]
pub fn client_connected(_ctx: &ReducerContext) {}

#[reducer(client_disconnected)]
pub fn client_disconnected(_ctx: &ReducerContext) {}

#[reducer]
pub fn create_object(
    ctx: &ReducerContext,
    id: String,
    name: String,
    personality: String,
    backstory: String,
    voice_description: String,
    image_url: String,
    original_image_url: String,
    voice_id: String,
) -> Result<(), String> {
    if name.is_empty() || personality.is_empty() || image_url.is_empty() {
        return Err("name, personality, and image_url are required".to_string());
    }

    ctx.db.npc_object().insert(NpcObject {
        id,
        name,
        personality,
        backstory,
        voice_description,
        image_url,
        original_image_url,
        voice_id,
        times_talked_to: 0,
        created_at: ctx.timestamp,
    });

    Ok(())
}

#[reducer]
pub fn update_object(
    ctx: &ReducerContext,
    id: String,
    name: String,
    personality: String,
    backstory: String,
    voice_description: String,
    image_url: String,
    original_image_url: String,
    voice_id: String,
) -> Result<(), String> {
    let existing = ctx.db.npc_object().id().find(&id)
        .ok_or("Object not found")?;

    ctx.db.npc_object().id().update(NpcObject {
        name,
        personality,
        backstory,
        voice_description,
        image_url,
        original_image_url,
        voice_id,
        ..existing
    });

    Ok(())
}

#[reducer]
pub fn delete_object(ctx: &ReducerContext, id: String) -> Result<(), String> {
    if ctx.db.npc_object().id().find(&id).is_none() {
        return Err("Object not found".to_string());
    }
    ctx.db.npc_object().id().delete(&id);
    Ok(())
}

#[reducer]
pub fn increment_talk_count(ctx: &ReducerContext, id: String) -> Result<(), String> {
    let existing = ctx.db.npc_object().id().find(&id)
        .ok_or("Object not found")?;

    ctx.db.npc_object().id().update(NpcObject {
        times_talked_to: existing.times_talked_to + 1,
        ..existing
    });

    Ok(())
}
