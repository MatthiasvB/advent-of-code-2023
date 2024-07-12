use tap::Pipe;

/// Defines utilities to conditionally tap closures to values in a chainable fashion.
pub trait TapIf {
    fn tap_if(self: &Self, condition: bool, runner: impl FnOnce(&Self) -> ()) -> &Self {
        if condition {
            runner(self);
        };
        self
    }

    fn tap_mut_if(
        self: &mut Self,
        condition: bool,
        modifier: impl FnOnce(&mut Self) -> (),
    ) -> &mut Self {
        if condition {
            modifier(self);
        };
        self
    }

    fn tap_if_fulfills(
        self: &Self,
        predicate: impl FnOnce(&Self) -> bool,
        runner: impl FnOnce(&Self) -> (),
    ) -> &Self {
        self.tap_if(predicate(self), runner)
    }

    fn tap_mut_if_fulfills(
        self: &mut Self,
        predicate: impl FnOnce(&Self) -> bool,
        modifier: impl FnOnce(&mut Self) -> (),
    ) -> &mut Self {
        self.tap_mut_if(predicate(self), modifier)
    }
}

/// Defines utilities to conditionally tap closures to values in a chainable fashion.
pub trait TapIfSized
where
    Self: Sized,
{
    // I wonder whether "into" fits well here
    fn tap_into_if(self, condition: bool, modifier: impl FnOnce(Self) -> Self) -> Self {
        if condition {
            modifier(self)
        } else {
            self
        }
    }

    // I wonder if "with" is a good name
    fn tap_with_if(mut self, condition: bool, modifier: impl FnOnce(&mut Self) -> ()) -> Self {
        if condition {
            modifier(&mut self);
        };
        self
    }

    fn tap_into_if_fulfills(
        self,
        predicate: impl FnOnce(&Self) -> bool,
        modifier: impl FnOnce(Self) -> Self,
    ) -> Self {
        predicate(&self).pipe(|condition| self.tap_into_if(condition, modifier))
    }

    fn tap_with_if_fulfills(
        mut self,
        predicate: impl FnOnce(&Self) -> bool,
        modifier: impl FnOnce(&mut Self) -> (),
    ) -> Self {
        predicate(&self).pipe(|condition| self.tap_with_if(condition, modifier))
    }
}

pub trait TapIfCloned
where
    Self: Sized + Clone,
{
    fn cloned_tap_if(self: &Self, condition: bool, modifier: impl FnOnce(&Self) -> Self) -> Self {
        if condition {
            modifier(self)
        } else {
            self.clone()
        }
    }

    fn cloned_tap_if_fulfills(
        self: &Self,
        predicate: impl FnOnce(&Self) -> bool,
        modifier: impl FnOnce(&Self) -> Self,
    ) -> Self {
        self.cloned_tap_if(predicate(self), modifier)
    }
}

impl<T> TapIf for T {}
impl<T: Sized> TapIfSized for T {}
impl<T: Sized + Clone> TapIfCloned for T {}
